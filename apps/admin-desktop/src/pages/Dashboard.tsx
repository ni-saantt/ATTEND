import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useStats } from '../lib/queries';

export default function Dashboard() {
  const { user } = useAuthStore();
  const showStats = user?.role === 'PLATFORM_ADMIN';
  const { data: stats, isLoading: statsLoading } = useStats(null, showStats);

  return (
    <>
      <h1>Dashboard</h1>
        <p>Welcome, {user?.email}</p>
        <p style={styles.role}>Role: {user?.role}</p>
        {user?.role === 'PLATFORM_ADMIN' && (
          <>
            {statsLoading ? (
              <p style={styles.muted}>Loading stats...</p>
            ) : stats && (
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.colleges ?? 0}</span>
                  <span style={styles.statLabel}>Colleges</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.users ?? 0}</span>
                  <span style={styles.statLabel}>Users</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.students ?? 0}</span>
                  <span style={styles.statLabel}>Students</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.attendance_records ?? 0}</span>
                  <span style={styles.statLabel}>Attendance Records</span>
                </div>
              </div>
            )}
            <div style={styles.actions}>
              <Link to="/colleges/new" style={styles.primaryButton}>Create College</Link>
              <Link to="/colleges" style={styles.secondaryButton}>View Colleges</Link>
            </div>
          </>
        )}
        {user?.role === 'SUPER_ADMIN' && user?.college_id && (
          <div style={styles.actions}>
            <Link to={`/colleges/${user.college_id}/departments`} style={styles.primaryButton}>
              Manage Departments
            </Link>
            <Link to={`/colleges/${user.college_id}/users`} style={styles.secondaryButton}>
              Manage Users
            </Link>
            <Link to={`/colleges/${user.college_id}/students`} style={styles.secondaryButton}>
              View Students
            </Link>
          </div>
        )}
        {user?.role === 'DEPARTMENT_ADMIN' && user?.college_id && (
          <div style={styles.actions}>
            <Link to={`/colleges/${user.college_id}/users`} style={styles.primaryButton}>
              Manage Users
            </Link>
            <Link to={`/colleges/${user.college_id}/users/new`} style={styles.secondaryButton}>
              Create User
            </Link>
            <Link to={`/colleges/${user.college_id}/departments`} style={styles.secondaryButton}>
              Departments
            </Link>
          </div>
        )}
        {user?.role === 'TEACHER' && (
          <p style={styles.teacherNote}>
            Teachers use the mobile app for enrollment, attendance, and reports.
          </p>
        )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  role: { opacity: 0.7, marginBottom: 24 },
  actions: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  primaryButton: {
    padding: '12 24',
    background: '#007AFF',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 600,
  },
  secondaryButton: {
    padding: '12 24',
    background: '#333',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 600,
  },
  muted: { opacity: 0.7, marginBottom: 16 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statValue: { fontSize: 28, fontWeight: 700, color: '#fff' },
  statLabel: { fontSize: 13, opacity: 0.7 },
  teacherNote: { opacity: 0.8, marginTop: 16, maxWidth: 400 },
};
