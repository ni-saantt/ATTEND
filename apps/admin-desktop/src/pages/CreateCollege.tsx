import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCollege, uploadCollegeLogo } from '../lib/queries';
import { createCollegeSchema } from '@attend/shared';

export default function CreateCollege() {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const createCollege = useCreateCollege();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const url = await uploadCollegeLogo(file);
      setLogoUrl(url);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parseResult = createCollegeSchema.safeParse({ name, logo_url: logoUrl || undefined });
    if (!parseResult.success) {
      setError(parseResult.error.errors[0]?.message ?? 'Invalid input');
      return;
    }
    try {
      await createCollege.mutateAsync({ name, logo_url: logoUrl.trim() || undefined });
      navigate('/colleges');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create college');
    }
  };

  return (
    <>
      <h1>Create College</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="College name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          required
        />
        <div style={styles.logoSection}>
          <label style={styles.label}>Logo (optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          {logoUrl && (
            <div style={styles.previewRow}>
              <img src={logoUrl} alt="Logo preview" style={styles.preview} />
              <span style={styles.previewText}>Uploaded</span>
            </div>
          )}
          {uploading && <span style={styles.uploading}>Uploading...</span>}
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button} disabled={createCollege.isPending}>
          {createCollege.isPending ? 'Creating...' : 'Create College'}
        </button>
      </form>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { maxWidth: 400, marginTop: 24 },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #444',
    background: '#0f0f0f',
    color: '#e0e0e0',
    fontSize: 16,
    marginBottom: 12,
  },
  logoSection: { marginBottom: 12 },
  label: { display: 'block', marginBottom: 4, fontSize: 14, opacity: 0.8 },
  fileInput: { fontSize: 14, color: '#e0e0e0' },
  previewRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
  preview: { width: 48, height: 48, objectFit: 'contain', borderRadius: 4 },
  previewText: { fontSize: 14, opacity: 0.7 },
  uploading: { fontSize: 14, opacity: 0.7, marginTop: 4 },
  error: { color: '#ff6b6b', marginBottom: 12 },
  button: {
    padding: 12,
    background: '#007AFF',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
