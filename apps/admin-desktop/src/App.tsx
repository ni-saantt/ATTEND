import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { Layout } from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Colleges from './pages/Colleges';
import CreateCollege from './pages/CreateCollege';
import EditCollege from './pages/EditCollege';
import CreateSuperAdmin from './pages/CreateSuperAdmin';
import Departments from './pages/Departments';
import Users from './pages/Users';
import Students from './pages/Students';
import Subjects from './pages/Subjects';
import CreateUser from './pages/CreateUser';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/colleges" element={<Colleges />} />
          <Route path="/colleges/new" element={<CreateCollege />} />
          <Route path="/colleges/:collegeId/edit" element={<EditCollege />} />
          <Route path="/colleges/:collegeId/super-admin" element={<CreateSuperAdmin />} />
          <Route path="/colleges/:collegeId/departments" element={<Departments />} />
          <Route path="/colleges/:collegeId/users" element={<Users />} />
          <Route path="/colleges/:collegeId/users/new" element={<CreateUser />} />
          <Route path="/colleges/:collegeId/students" element={<Students />} />
          <Route path="/colleges/:collegeId/departments/:departmentId/subjects" element={<Subjects />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
