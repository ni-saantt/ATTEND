import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateSuperAdmin, useColleges } from '../lib/queries';
import { createUserSchema } from '@attend/shared';

export default function CreateSuperAdmin() {
  const { collegeId } = useParams();
  const { data: colleges = [] } = useColleges();
  const college = colleges.find((c: { id: string; name: string }) => c.id === collegeId);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const createSuperAdmin = useCreateSuperAdmin(collegeId ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parseResult = createUserSchema.safeParse({
      email,
      password,
      role: 'SUPER_ADMIN' as const,
      college_id: collegeId ?? null,
    });
    if (!parseResult.success) {
      setError(parseResult.error.errors[0]?.message ?? 'Invalid input');
      return;
    }
    try {
      await createSuperAdmin.mutateAsync({ email, password });
      navigate(`/colleges/${collegeId}/users`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create Super Admin');
    }
  };

  return (
    <>
      <h1>Create Super Admin</h1>
      <p style={styles.subtitle}>
        Assign a Super Admin to manage <strong>{college?.name ?? 'this college'}</strong>
      </p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button} disabled={createSuperAdmin.isPending}>
          {createSuperAdmin.isPending ? 'Creating...' : 'Create Super Admin'}
        </button>
      </form>
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
