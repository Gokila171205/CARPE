import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

import Layout from './components/Layout';
import Collections from './pages/Collections';
import AddCollection from './pages/AddCollection';
import Vehicles from './pages/Vehicles';

import Analytics from './pages/Analytics';
import Map from './pages/Map';
import Forecast from './pages/Forecast';
import Alerts from './pages/Alerts';
import AIInsights from './pages/AIInsights';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes with Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/add" element={<AddCollection />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/map" element={<Map />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/ai-insights" element={<AIInsights />} />
        <Route path="/insights" element={<AIInsights />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
