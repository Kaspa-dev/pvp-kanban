// Mock authentication utilities using localStorage

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

const AUTH_STORAGE_KEY = 'banban_auth';
const USERS_STORAGE_KEY = 'banban_users';

// Get all registered users
export function getRegisteredUsers(): Record<string, { password: string; user: User }> {
  const users = localStorage.getItem(USERS_STORAGE_KEY);
  return users ? JSON.parse(users) : {};
}

// Save registered users
function saveRegisteredUsers(users: Record<string, { password: string; user: User }>) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// Get current auth state
export function getAuthState(): AuthState {
  const authData = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!authData) {
    return { user: null, token: null };
  }
  try {
    return JSON.parse(authData);
  } catch {
    return { user: null, token: null };
  }
}

// Save auth state
export function saveAuthState(state: AuthState) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

// Clear auth state
export function clearAuthState() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Login
export function login(email: string, password: string): { success: boolean; user?: User; token?: string; error?: string } {
  const users = getRegisteredUsers();
  const userEntry = users[email.toLowerCase()];

  if (!userEntry || userEntry.password !== password) {
    return { success: false, error: 'Invalid email or password' };
  }

  const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const authState: AuthState = {
    user: userEntry.user,
    token,
  };

  saveAuthState(authState);

  return {
    success: true,
    user: userEntry.user,
    token,
  };
}

// Register
export function register(
  name: string,
  email: string,
  password: string
): { success: boolean; user?: User; token?: string; error?: string } {
  const users = getRegisteredUsers();
  const emailLower = email.toLowerCase();

  if (users[emailLower]) {
    return { success: false, error: 'Email already registered' };
  }

  const user: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    email: emailLower,
  };

  users[emailLower] = { password, user };
  saveRegisteredUsers(users);

  const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const authState: AuthState = {
    user,
    token,
  };

  saveAuthState(authState);

  return {
    success: true,
    user,
    token,
  };
}

// Logout
export function logout() {
  clearAuthState();
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const authState = getAuthState();
  return !!(authState.user && authState.token);
}

// Update user profile
export function updateUserProfile(updates: Partial<User>): { success: boolean; user?: User; error?: string } {
  const authState = getAuthState();
  
  if (!authState.user) {
    return { success: false, error: 'Not authenticated' };
  }

  const users = getRegisteredUsers();
  const userEntry = users[authState.user.email];

  if (!userEntry) {
    return { success: false, error: 'User not found' };
  }

  // Update user data
  const updatedUser = { ...userEntry.user, ...updates };
  userEntry.user = updatedUser;

  // If email changed, update the key
  if (updates.email && updates.email !== authState.user.email) {
    const oldEmail = authState.user.email;
    users[updates.email.toLowerCase()] = userEntry;
    delete users[oldEmail];
  }

  saveRegisteredUsers(users);

  // Update auth state
  authState.user = updatedUser;
  saveAuthState(authState);

  return { success: true, user: updatedUser };
}
