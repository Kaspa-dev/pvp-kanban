import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Projects } from './pages/Projects';
import { Board } from './pages/BoardNew';
import { PlanningPokerRoom } from './pages/PlanningPokerRoom';
import { Profile } from './pages/Profile';
import { ProfileMilestones } from './pages/ProfileMilestones';
import { MyTasks } from './pages/MyTasks';
import { TaskDetailsPage } from './pages/TaskDetails';
import { LevelBadges } from './pages/LevelBadges';
import { LevelProgress } from './pages/LevelProgress';
import { LevelLeaderboard } from './pages/LevelLeaderboard';
import { LevelXpGain } from './pages/LevelXpGain';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { AuthStatusScreen } from './components/AuthStatusScreen';
import { Toaster } from './components/ui/toast';

// AppRoutes must be inside AuthProvider to use useAuth
function AppRoutes() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <AuthStatusScreen title="Restoring session..." />;
  }

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
      <Route path="/levelbadges" element={<LevelBadges />} />
      <Route path="/levelprogress" element={<LevelProgress />} />
      <Route path="/levelleaderboard" element={<LevelLeaderboard />} />
      <Route path="/levelxpgain" element={<LevelXpGain />} />

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
        path="/app/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/profile/milestones"
        element={
          <ProtectedRoute>
            <ProfileMilestones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/my-tasks"
        element={
          <ProtectedRoute>
            <MyTasks />
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
      <Route
        path="/app/:boardId/tasks/:taskId"
        element={
          <ProtectedRoute>
            <TaskDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/planning-poker/:joinToken" element={<PlanningPokerRoom />} />

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
          <UserPreferencesProvider>
            <AppRoutes />
            <Toaster />
          </UserPreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
