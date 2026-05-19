import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import logoDark from '../assets/logo-dark.png';

export function Layout() {
  const { user, logout } = useAuthStore();

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <img src={logoDark} alt="Attend" style={styles.logo} />
        <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>Dashboard</Link>
          {(user?.role === 'PLATFORM_ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <Link to="/colleges" style={styles.navLink}>Colleges</Link>
          )}
        </nav>
        <button onClick={logout} style={styles.logout}>Sign Out</button>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 240,
    background: '#1a1a1a',
    padding: 24,
    borderRight: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
  },
  logo: { width: 120, height: 40, objectFit: 'contain' as const, marginBottom: 32 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4 },
  navLink: { color: '#e0e0e0', padding: 8, textDecoration: 'none', borderRadius: 6 },
  logout: {
    marginTop: 'auto',
    padding: 8,
    background: 'transparent',
    border: '1px solid #444',
    color: '#e0e0e0',
    borderRadius: 6,
    cursor: 'pointer',
  },
  main: { flex: 1, padding: 32 },
};
