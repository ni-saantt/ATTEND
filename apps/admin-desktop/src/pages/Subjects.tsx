import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject, useDepartments } from '../lib/queries';

export default function Subjects() {
  const { collegeId, departmentId } = useParams();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState('');
  const { data: subjects = [], isLoading } = useSubjects(departmentId ?? null);
  const { data: departments = [] } = useDepartments(collegeId ?? null);
  const createSubject = useCreateSubject(departmentId ?? '');
  const updateSubject = useUpdateSubject(departmentId ?? '');
  const deleteSubject = useDeleteSubject(departmentId ?? '');

  const department = departments.find((d: { id: string }) => d.id === departmentId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Subject name is required');
      return;
    }
    try {
      await createSubject.mutateAsync(name.trim());
      setName('');
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response
        : null;
      setError(res?.data?.detail || 'Failed to create subject');
    }
  };

  const handleEditOpen = (s: { id: string; name: string }) => {
    setEditingSubject(s);
    setEditName(s.name);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editName.trim()) return;
    try {
      await updateSubject.mutateAsync({ subjectId: editingSubject.id, name: editName.trim() });
      setEditingSubject(null);
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response
        : null;
      setError(res?.data?.detail || 'Failed to update subject');
    }
  };

  const handleDelete = async (s: { id: string; name: string }) => {
    if (!window.confirm(`Delete subject "${s.name}"? This cannot be undone.`)) return;
    try {
      await deleteSubject.mutateAsync(s.id);
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response
        : null;
      setError(res?.data?.detail || 'Failed to delete subject');
    }
  };

  return (
    <>
      <h1>Subjects</h1>
      {department && (
        <p style={styles.subtitle}>{department.name}</p>
      )}
      <form onSubmit={handleCreate} style={styles.form}>
        {error && <p style={{ color: '#ff6b6b', marginBottom: 8 }}>{error}</p>}
        <input
          type="text"
          placeholder="Subject name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={createSubject.isPending}>
          Add Subject
        </button>
      </form>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul style={styles.list}>
          {subjects.map((s: { id: string; name: string }) => (
            <li key={s.id} style={styles.item}>
              <span>{s.name}</span>
              <span style={styles.rowActions}>
                <button
                  type="button"
                  style={styles.actionBtn}
                  onClick={() => handleEditOpen(s)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  style={styles.actionBtnDanger}
                  onClick={() => handleDelete(s)}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {editingSubject && (
        <div style={styles.modalOverlay} onClick={() => setEditingSubject(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Edit Subject</h3>
            <form onSubmit={handleEditSave}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={styles.input}
                autoFocus
              />
              <div style={styles.modalActions}>
                <button type="button" style={styles.secondaryBtn} onClick={() => setEditingSubject(null)}>
                  Cancel
                </button>
                <button type="submit" style={styles.button} disabled={updateSubject.isPending}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Link to={`/colleges/${collegeId}/departments`} style={styles.backLink}>
        ← Back to Departments
      </Link>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  subtitle: { opacity: 0.7, marginBottom: 24 },
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
    padding: '12px 24px',
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
  rowActions: { display: 'flex', gap: 8 },
  actionBtn: {
    padding: '6px 12px',
    background: 'transparent',
    color: '#007AFF',
    border: '1px solid #007AFF',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  actionBtnDanger: {
    padding: '6px 12px',
    background: 'transparent',
    color: '#ff6b6b',
    border: '1px solid #ff6b6b',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1a1a1a',
    padding: 24,
    borderRadius: 12,
    minWidth: 320,
    border: '1px solid #333',
  },
  modalActions: { display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' },
  secondaryBtn: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#e0e0e0',
    border: '1px solid #444',
    borderRadius: 8,
    cursor: 'pointer',
  },
  backLink: { display: 'inline-block', marginTop: 24, color: '#007AFF', textDecoration: 'none' },
};
