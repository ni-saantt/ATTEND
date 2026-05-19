import { Link } from 'react-router-dom';
import { useColleges } from '../lib/queries';

export default function Colleges() {
  const { data: colleges = [], isLoading, isError, error } = useColleges();

  if (isLoading) return <div>Loading...</div>;
  if (isError) {
    const isNetworkError = error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK';
    const msg = isNetworkError
      ? 'Could not connect to server. Is the backend running?'
      : error?.response?.data?.detail ?? 'Please try again.';
    return <div style={{ color: '#e74c3c' }}>Failed to load colleges. {msg}</div>;
  }

  return (
    <>
      <div style={styles.header}>
        <h1>Colleges</h1>
        <Link to="/colleges/new" style={styles.addButton}>+ Create College</Link>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {colleges.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>
                <Link to={`/colleges/${c.id}/edit`} style={styles.link}>Edit / Logo</Link>
                {' | '}
                <Link to={`/colleges/${c.id}/departments`} style={styles.link}>Departments</Link>
                {' | '}
                <Link to={`/colleges/${c.id}/super-admin`} style={styles.link}>Add Super Admin</Link>
                {' | '}
                <Link to={`/colleges/${c.id}/users`} style={styles.link}>Users</Link>
                {' | '}
                <Link to={`/colleges/${c.id}/students`} style={styles.link}>Students</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  addButton: {
    padding: '10 20',
    background: '#007AFF',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 600,
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  link: { color: '#007AFF', marginRight: 12 },
};
