import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ENDPOINTS } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { loginSchema, loginResponseSchema } from '@attend/shared';
import logoDark from '../assets/logo-dark.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parseResult = loginSchema.safeParse({ email, password });
    if (!parseResult.success) {
      setError(parseResult.error.errors[0]?.message ?? 'Invalid input');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(ENDPOINTS.LOGIN, parseResult.data);
      const parsed = loginResponseSchema.parse(data);
      setAuth(parsed.access_token, parsed.user);
      navigate('/');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const detailStr = Array.isArray(detail) ? detail[0]?.msg ?? String(detail) : detail;
      setError(err?.name === 'ZodError' ? 'Invalid response from server' : (detailStr || err?.message || 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={logoDark} alt="Attend" style={styles.logo} />
        <p style={styles.subtitle}>College Administration</p>
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
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    background: '#1a1a1a',
    borderRadius: 12,
    border: '1px solid #333',
  },
  logo: { width: 160, height: 50, objectFit: 'contain' as const, marginBottom: 8 },
  subtitle: { margin: '4px 0 24px', opacity: 0.7 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    padding: 12,
    borderRadius: 8,
    border: '1px solid #444',
    background: '#0f0f0f',
    color: '#e0e0e0',
    fontSize: 16,
  },
  error: { color: '#ff6b6b', margin: 0, fontSize: 14 },
  button: {
    padding: 14,
    borderRadius: 8,
    border: 'none',
    background: '#007AFF',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
};
