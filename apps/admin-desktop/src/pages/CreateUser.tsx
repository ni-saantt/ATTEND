import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCreateUser, useDepartments } from '../lib/queries';
import { useAuthStore } from '../store/auth';
import { createUserSchema } from '@attend/shared';

type CreateableRole = 'DEPARTMENT_ADMIN' | 'TEACHER';

export default function CreateUser() {
  const { collegeId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [error, setError] = useState('');

  const { data: departments = [] } = useDepartments(collegeId ?? null);
  const createUser = useCreateUser(collegeId ?? '');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isDeptAdmin = user?.role === 'DEPARTMENT_ADMIN';
  const targetRole: CreateableRole = isSuperAdmin ? 'DEPARTMENT_ADMIN' : 'TEACHER';
  const effectiveDeptId = isDeptAdmin ? (user?.department_id ?? '') : departmentId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parseResult = createUserSchema.safeParse({
      email,
      password,
      role: targetRole,
      college_id: collegeId ?? null,
      department_id: effectiveDeptId || null,
    });
    if (!parseResult.success) {
      setError(parseResult.error.errors[0]?.message ?? 'Invalid input');
      return;
    }
    if (!effectiveDeptId) {
      setError('Department is required');
      return;
    }
    try {
      await createUser.mutateAsync({
        email,
        password,
        role: targetRole,
        college_id: collegeId!,
        department_id: effectiveDeptId,
      });
      navigate(`/colleges/${collegeId}/users`);
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response
        : null;
      setError(res?.data?.detail || 'Failed to create user');
    }
  };

  return (
    <>
      <h1>Create {targetRole.replace('_', ' ')}</h1>
      <p style={styles.subtitle}>
        {isSuperAdmin
          ? 'Assign a Department Admin to manage a department'
          : 'Assign a Teacher to take attendance'}
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
          minLength={6}
        />
        {isSuperAdmin && (
          <div style={styles.field}>
            <label style={styles.label}>Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              style={styles.select}
              required
            >
              <option value="">Select department</option>
              {departments.map((d: { id: string; name: string }) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
        {isDeptAdmin && (
          <div style={styles.field}>
            <label style={styles.label}>Department</label>
            <input
              type="text"
              value={departments.find((d: { id: string }) => d.id === user?.department_id)?.name ?? '—'}
              readOnly
              style={styles.input}
            />
          </div>
        )}
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button} disabled={createUser.isPending}>
          {createUser.isPending ? 'Creating...' : `Create ${targetRole.replace('_', ' ')}`}
        </button>
      </form>
      <Link to={`/colleges/${collegeId}/users`} style={styles.backLink}>
        ← Back to Users
      </Link>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  subtitle: { opacity: 0.7, marginBottom: 24 },
  form: { maxWidth: 400, marginTop: 24 },
  field: { marginBottom: 12 },
  label: { display: 'block', marginBottom: 4, fontSize: 14, opacity: 0.8 },
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
  select: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #444',
    background: '#0f0f0f',
    color: '#e0e0e0',
    fontSize: 16,
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
    marginTop: 8,
  },
  backLink: { display: 'inline-block', marginTop: 24, color: '#007AFF', textDecoration: 'none' },
};
