import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Projects } from './pages/Projects';
import { Board } from './pages/BoardNew';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// AppRoutes must be inside AuthProvider to use useAuth
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/app" replace /> : <Landing />} 
      />
      
      {/* Auth routes - redirect to /app if already authenticated */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/app" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/app" replace /> : <Register />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/app" replace /> : <ForgotPassword />}
      />

      {/* Protected app routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/:boardId"
        element={
          <ProtectedRoute>
            <Board />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}