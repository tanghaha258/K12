import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/layout/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Grades from '@/pages/Grades';
import Classes from '@/pages/Classes';
import Students from '@/pages/Students';
import Teachers from '@/pages/Teachers';
import Dorms from '@/pages/Dorms';
import DataScopes from '@/pages/DataScopes';
import UserManagement from '@/pages/Users';
import Roles from '@/pages/Roles';
import Dict from '@/pages/Dict';
import Exams from '@/pages/Exams';
import Analysis from '@/pages/Analysis';
import Settings from '@/pages/Settings';
import Moral from '@/pages/Moral';
import MoralEventEntry from '@/pages/MoralEventEntry';
import MoralStats from '@/pages/MoralStats';
import DormMoral from '@/pages/DormMoral';

function App() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/dorms" element={<Dorms />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/dict" element={<Dict />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/datascopes" element={<DataScopes />} />
          <Route path="/moral" element={<Moral />} />
          <Route path="/moral/entry" element={<MoralEventEntry />} />
          <Route path="/moral/stats" element={<MoralStats />} />
          <Route path="/dorm-moral" element={<DormMoral />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

export default App;
