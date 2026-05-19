import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUsers, useDeleteUser } from '../lib/queries';
import { useAuthStore } from '../store/auth';
import { api } from '../lib/api';
import { ENDPOINTS } from '@attend/shared';

export default function Users() {
  const { collegeId } = useParams();
  const { user } = useAuthStore();
  const { data: users = [], isLoading } = useUsers(collegeId ?? null);
  const deleteUser = useDeleteUser(collegeId ?? null);
  const canCreateUser = user?.role === 'SUPER_ADMIN' || user?.role === 'DEPARTMENT_ADMIN';
  const [confirmUser, setConfirmUser] = useState<{ email: string } | null>(null);
  const [deleteUserState, setDeleteUserState] = useState<{ id: string; email: string; role: string } | null>(null);
  const [sending, setSending] = useState(false);

  const canDelete = (targetRole: string) => {
    if (user?.role === 'PLATFORM_ADMIN') return targetRole === 'SUPER_ADMIN';
    if (user?.role === 'SUPER_ADMIN') return targetRole === 'DEPARTMENT_ADMIN' || targetRole === 'TEACHER';
    if (user?.role === 'DEPARTMENT_ADMIN') return targetRole === 'TEACHER';
    return false;
  };

  const handleResendClick = (u: { email: string }) => setConfirmUser({ email: u.email });
  const handleConfirmCancel = () => setConfirmUser(null);

  const handleConfirmSend = async () => {
    if (!confirmUser) return;
    setSending(true);
    try {
      const { data } = await api.post(ENDPOINTS.RESEND_VERIFICATION, { email: confirmUser.email });
      alert(data?.message ?? 'Verification email sent.');
      setConfirmUser(null);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? 'Failed to send verification email.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteClick = (u: { id: string; email: string; role: string }) => setDeleteUserState(u);
  const handleDeleteCancel = () => setDeleteUserState(null);

  const handleDeleteConfirm = async () => {
    if (!deleteUserState) return;
    try {
      await deleteUser.mutateAsync(deleteUserState.id);
      alert('User deleted.');
      setDeleteUserState(null);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? 'Failed to delete user.');
    }
  };

  return (
    <>
      <div style={styles.header}>
        <h1>Users</h1>
        {canCreateUser && (
          <Link to={`/colleges/${collegeId}/users/new`} style={styles.addButton}>
            + Create User
          </Link>
        )}
      </div>
      {isLoading && <p>Loading...</p>}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: { id: string; email: string; role: string; name?: string; contact_number?: string }) => (
            <tr key={u.id}>
              <td>{u.name || '—'}</td>
              <td>{u.contact_number || '—'}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td style={styles.actionsCell}>
                <button
                  type="button"
                  style={styles.resendBtn}
                  onClick={() => handleResendClick(u)}
                >
                  Resend verification
                </button>
                {canDelete(u.role) && (
                  <button
                    type="button"
                    style={styles.deleteBtn}
                    onClick={() => handleDeleteClick(u)}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmUser && (
        <div style={styles.overlay}>
          <div style={styles.confirmCard}>
            <h3 style={styles.confirmTitle}>Send verification email again?</h3>
            <p style={styles.confirmText}>
              Are you sure you want to send the verification email to <strong>{confirmUser.email}</strong>?
            </p>
            <div style={styles.confirmActions}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={handleConfirmCancel}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="button"
                style={styles.sendBtn}
                onClick={handleConfirmSend}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteUserState && (
        <div style={styles.overlay}>
          <div style={styles.confirmCard}>
            <h3 style={styles.confirmTitle}>Delete user?</h3>
            <p style={styles.confirmText}>
              Are you sure you want to delete <strong>{deleteUserState.email}</strong> ({deleteUserState.role})? This cannot be undone.
            </p>
            <div style={styles.confirmActions}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={handleDeleteCancel}
                disabled={deleteUser.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                style={styles.deleteConfirmBtn}
                onClick={handleDeleteConfirm}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  addButton: {
    padding: '10px 20px',
    background: '#007AFF',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 600,
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  actionsCell: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  resendBtn: {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid #007AFF',
    color: '#007AFF',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confirmCard: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '90%',
  },
  confirmTitle: { margin: '0 0 12px', fontSize: 18 },
  confirmText: { margin: '0 0 20px', color: '#aaa', fontSize: 14, lineHeight: 1.5 },
  confirmActions: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #555',
    color: '#e0e0e0',
    borderRadius: 8,
    cursor: 'pointer',
  },
  sendBtn: {
    padding: '10px 20px',
    background: '#007AFF',
    border: 'none',
    color: '#fff',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  deleteBtn: {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid #ff3b30',
    color: '#ff3b30',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  deleteConfirmBtn: {
    padding: '10px 20px',
    background: '#ff3b30',
    border: 'none',
    color: '#fff',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
};
