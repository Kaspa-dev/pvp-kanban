import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RegisterInput, User, bootstrapAuth, login as authLogin, register as authRegister, logout as authLogout } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  login: async () => ({ success: false, error: 'Auth not initialized' }),
  register: async () => ({ success: false, error: 'Auth not initialized' }),
  logout: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isActive = true;

    const initializeAuth = async () => {
      const restoredUser = await bootstrapAuth();
      if (!isActive) {
        return;
      }

      setUser(restoredUser);
      setIsInitializing(false);
    };

    void initializeAuth();

    return () => {
      isActive = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authLogin(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const register = async (input: RegisterInput) => {
    const result = await authRegister(input);
    if (result.success && result.user) {
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isInitializing,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
