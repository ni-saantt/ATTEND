import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStudents, useDepartments, useUpdateStudent, useDeleteStudent, useGenerateEmbeddings } from '../lib/queries';

type Student = { id: string; reg_no: string; name: string; department_id: string };

export default function Students() {
  const { collegeId } = useParams();
  const { data: students = [], isLoading } = useStudents(collegeId ?? null);
  const { data: departments = [] } = useDepartments(collegeId ?? null);
  const updateStudent = useUpdateStudent(collegeId ?? null);
  const deleteStudent = useDeleteStudent(collegeId ?? null);
  const generateEmbeddings = useGenerateEmbeddings(collegeId ?? null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ reg_no: '', name: '', department_id: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null);

  const deptName = (id: string) => departments.find((d: { id: string; name: string }) => d.id === id)?.name ?? id;

  const startEdit = (s: Student) => {
    setEditing(s);
    setEditForm({ reg_no: s.reg_no, name: s.name, department_id: s.department_id });
  };
  const cancelEdit = () => setEditing(null);
  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateStudent.mutateAsync({
        studentId: editing.id,
        reg_no: editForm.reg_no || undefined,
        name: editForm.name || undefined,
        department_id: editForm.department_id || undefined,
      });
      cancelEdit();
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? 'Failed to update student');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteStudent.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? 'Failed to delete student');
    }
  };

  return (
    <>
      <h1>Students</h1>
      <p style={styles.note}>Enroll students via the mobile app (Department Admin). Edit or delete below.</p>
      {collegeId && (
        <button
          type="button"
          style={styles.embedBtn}
          onClick={async () => {
            try {
              const res = await generateEmbeddings.mutateAsync();
              const msg = res.generated > 0
                ? `Generated ${res.generated} embedding(s). Recognition works immediately—no restart needed.`
                : res.skipped > 0
                  ? 'All students already have embeddings.'
                  : 'No students with face images need embeddings.';
              alert(res.failed?.length ? `${msg}\n\nFailed: ${res.failed.join('; ')}` : msg);
            } catch (e: any) {
              alert(e?.response?.data?.detail ?? 'Failed to generate embeddings');
            }
          }}
          disabled={generateEmbeddings.isPending}
        >
          {generateEmbeddings.isPending ? 'Generating...' : 'Generate embeddings'}
        </button>
      )}
      {isLoading && <p>Loading...</p>}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Reg No</th>
            <th>Name</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s: Student) => (
            <tr key={s.id}>
              <td>{s.reg_no}</td>
              <td>{s.name}</td>
              <td>{deptName(s.department_id)}</td>
              <td>
                <button type="button" style={styles.editBtn} onClick={() => startEdit(s)}>Edit</button>
                <button type="button" style={styles.deleteBtn} onClick={() => setDeleteConfirm(s)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Edit Student</h3>
            <label style={styles.label}>Reg No</label>
            <input
              style={styles.input}
              value={editForm.reg_no}
              onChange={(e) => setEditForm((f) => ({ ...f, reg_no: e.target.value }))}
            />
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <label style={styles.label}>Department</label>
            <select
              style={styles.input}
              value={editForm.department_id}
              onChange={(e) => setEditForm((f) => ({ ...f, department_id: e.target.value }))}
            >
              {departments.map((d: { id: string; name: string }) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <div style={styles.modalActions}>
              <button type="button" style={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
              <button type="button" style={styles.saveBtn} onClick={saveEdit} disabled={updateStudent.isPending}>
                {updateStudent.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Delete student?</h3>
            <p>Are you sure you want to delete {deleteConfirm.name} ({deleteConfirm.reg_no})? This cannot be undone.</p>
            <div style={styles.modalActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button type="button" style={styles.deleteConfirmBtn} onClick={confirmDelete} disabled={deleteStudent.isPending}>
                {deleteStudent.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  note: { opacity: 0.7, marginBottom: 24 },
  embedBtn: { marginBottom: 24, padding: '10px 20px', background: '#34C759', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  table: { width: '100%', borderCollapse: 'collapse' },
  editBtn: { padding: '4px 8px', marginRight: 8, background: 'transparent', border: '1px solid #007AFF', color: '#007AFF', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  deleteBtn: { padding: '4px 8px', background: 'transparent', border: '1px solid #ff3b30', color: '#ff3b30', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%' },
  label: { display: 'block', marginBottom: 4, fontSize: 14 },
  input: { width: '100%', padding: 10, marginBottom: 16, borderRadius: 8, border: '1px solid #444', background: '#0f0f0f', color: '#e0e0e0' },
  modalActions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { padding: '10px 20px', background: 'transparent', border: '1px solid #555', color: '#e0e0e0', borderRadius: 8, cursor: 'pointer' },
  saveBtn: { padding: '10px 20px', background: '#007AFF', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  deleteConfirmBtn: { padding: '10px 20px', background: '#ff3b30', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
};
