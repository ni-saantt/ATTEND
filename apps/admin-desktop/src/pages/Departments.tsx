import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '../lib/queries';
import { createDepartmentSchema } from '@attend/shared';

export default function Departments() {
  const { collegeId } = useParams();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const { data: departments = [], isLoading } = useDepartments(collegeId ?? null);
  const createDept = useCreateDepartment(collegeId ?? '');
  const updateDept = useUpdateDepartment(collegeId ?? null);
  const deleteDept = useDeleteDepartment(collegeId ?? null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parseResult = createDepartmentSchema.safeParse({
      college_id: collegeId ?? '',
      name,
    });
    if (!parseResult.success) {
      setError(parseResult.error.errors[0]?.message ?? 'Invalid input');
      return;
    }
    try {
      await createDept.mutateAsync(name);
      setName('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create department');
    }
  };

  const startEdit = (d: { id: string; name: string }) => {
    setEditingId(d.id);
    setEditName(d.name);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };
  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updateDept.mutateAsync({ departmentId: editingId, name: editName.trim() });
      cancelEdit();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update department');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDept.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete department');
    }
  };

  return (
    <>
      <h1>Departments</h1>
      <form onSubmit={handleCreate} style={styles.form}>
        {error && <p style={{ color: '#ff6b6b', marginBottom: 8 }}>{error}</p>}
        <input
          type="text"
          placeholder="Department name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={createDept.isPending}>Add Department</button>
      </form>
      <ul style={styles.list}>
        {departments.map((d: { id: string; name: string }) => (
          <li key={d.id} style={styles.item}>
            {editingId === d.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={styles.editInput}
                  autoFocus
                />
                <span style={styles.editActions}>
                  <button type="button" style={styles.smallBtn} onClick={saveEdit} disabled={updateDept.isPending}>Save</button>
                  <button type="button" style={styles.smallCancelBtn} onClick={cancelEdit}>Cancel</button>
                </span>
              </>
            ) : (
              <>
                {d.name}
                <span style={styles.actions}>
                  <Link to={`/colleges/${collegeId}/departments/${d.id}/subjects`} style={styles.subjectLink}>Subjects</Link>
                  <button type="button" style={styles.editBtn} onClick={() => startEdit(d)}>Edit</button>
                  <button type="button" style={styles.deleteBtn} onClick={() => setDeleteConfirm({ id: d.id, name: d.name })}>Delete</button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>

      {deleteConfirm && (
        <div style={styles.overlay}>
          <div style={styles.confirmCard}>
            <h3>Delete department?</h3>
            <p>Are you sure you want to delete &quot;{deleteConfirm.name}&quot;? It must have no students or subjects.</p>
            <div style={styles.confirmActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button type="button" style={styles.deleteConfirmBtn} onClick={confirmDelete} disabled={deleteDept.isPending}>
                {deleteDept.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { display: 'flex', gap: 12, marginBottom: 24 },
  input: {
    flex: 1,
    maxWidth: 300,
    padding: 12,
    borderRadius: 8,
    border: '1px solid #444',
    background: '#0f0f0f',
    color: '#e0e0e0',
  },
  button: {
    padding: '12 24',
    background: '#007AFF',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  item: {
    padding: 12,
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: { display: 'flex', gap: 8, alignItems: 'center' },
  subjectLink: { color: '#007AFF', textDecoration: 'none', fontSize: 14 },
  editBtn: { padding: '4px 8px', background: 'transparent', border: '1px solid #007AFF', color: '#007AFF', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  deleteBtn: { padding: '4px 8px', background: 'transparent', border: '1px solid #ff3b30', color: '#ff3b30', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  editInput: { flex: 1, maxWidth: 200, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#0f0f0f', color: '#e0e0e0' },
  editActions: { display: 'flex', gap: 8 },
  smallBtn: { padding: '4px 12px', background: '#007AFF', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  smallCancelBtn: { padding: '4px 12px', background: 'transparent', border: '1px solid #555', color: '#e0e0e0', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  confirmCard: { background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 24, maxWidth: 400 },
  confirmActions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { padding: '10px 20px', background: 'transparent', border: '1px solid #555', color: '#e0e0e0', borderRadius: 8, cursor: 'pointer' },
  deleteConfirmBtn: { padding: '10px 20px', background: '#ff3b30', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
};
