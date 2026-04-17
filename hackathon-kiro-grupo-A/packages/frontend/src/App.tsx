import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import ApiDetail from './pages/ApiDetail';
import Sandbox from './pages/Sandbox';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import ConsumerManagement from './pages/admin/ConsumerManagement';
import ApiManagement from './pages/admin/ApiManagement';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth routes — centered layout, no sidebar */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* App routes — sidebar + header layout */}
        <Route element={<AppLayout />}>
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/catalog/:id" element={<ApiDetail />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin/consumers" element={<ConsumerManagement />} />
          <Route path="/admin/apis" element={<ApiManagement />} />
        </Route>

        {/* Catch-all → catalog */}
        <Route path="*" element={<Navigate to="/catalog" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
