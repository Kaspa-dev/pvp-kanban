import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getAuthState, saveAuthState, clearAuthState, login as authLogin, register as authRegister, logout as authLogout } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Provide default values to prevent context undefined errors during HMR
const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  login: async () => ({ success: false, error: 'Auth not initialized' }),
  register: async () => ({ success: false, error: 'Auth not initialized' }),
  logout: () => {},
  updateUser: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load auth state from localStorage on mount
    const authState = getAuthState();
    if (authState.user) {
      setUser(authState.user);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const result = authLogin(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const register = async (name: string, email: string, password: string) => {
    const result = authRegister(name, email, password);
    if (result.success && result.user) {
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    const authState = getAuthState();
    authState.user = updatedUser;
    saveAuthState(authState);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  // Context now always has a value (default or actual), so just return it
  return context;
}
