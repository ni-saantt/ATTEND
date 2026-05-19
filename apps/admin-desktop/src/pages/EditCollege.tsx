import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCollege, useUpdateCollege, uploadCollegeLogo } from '../lib/queries';

export default function EditCollege() {
  const { collegeId } = useParams();
  const { data: college, isLoading } = useCollege(collegeId ?? null);
  const updateCollege = useUpdateCollege(collegeId ?? '');
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (college) {
      setName(college.name ?? '');
      setLogoUrl(college.logo_url ?? '');
    }
  }, [college]);

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
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      await updateCollege.mutateAsync({
        name: name.trim(),
        logo_url: logoUrl.trim() || undefined,
      });
      navigate('/colleges');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
        : detail?.message || err.message || 'Failed to update college';
      setError(msg);
    }
  };

  if (isLoading || !college) return <div>Loading...</div>;

  return (
    <>
      <h1>Edit College</h1>
      <p style={styles.subtitle}>{college.name}</p>
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
          <label style={styles.label}>Logo</label>
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
              <span style={styles.previewText}>Current / Uploaded</span>
            </div>
          )}
          {uploading && <span style={styles.uploading}>Uploading...</span>}
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button} disabled={updateCollege.isPending}>
          {updateCollege.isPending ? 'Saving...' : 'Save'}
        </button>
      </form>
      <Link to="/colleges" style={styles.backLink}>← Back to Colleges</Link>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  subtitle: { opacity: 0.7, marginBottom: 24 },
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
  backLink: { display: 'inline-block', marginTop: 24, color: '#007AFF', textDecoration: 'none' },
};
