export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: ApiUser;
}

interface AuthErrorResponse {
  message?: string;
}

interface ApiUser {
  id: number | string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

const LEGACY_RESET_MARKER_KEY = "banban_real_auth_bootstrapped_v2";
const LEGACY_STORAGE_KEYS = new Set([
  "banban_auth",
  "banban_users",
  "banban_sprints",
  "banban_user_progress",
]);
const LEGACY_STORAGE_PREFIXES = [
  "banban_boards_",
  "banban_cards_",
  "banban_labels_",
  "banban_user_progress_",
];

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function normalizeUser(user: ApiUser): User {
  return {
    id: String(user.id),
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
  };
}

function setAccessToken(token: string | null) {
  accessToken = token;
}

function createAuthorizedHeaders(headers: HeadersInit = {}): HeadersInit {
  const nextHeaders = new Headers(headers);
  if (accessToken) {
    nextHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  return nextHeaders;
}

function createRequestHeaders(init: RequestInit): HeadersInit {
  const headers = new Headers(init.headers ?? {});
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return createAuthorizedHeaders(headers);
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as AuthErrorResponse).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text) as T;
}

async function authRequest(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<{ success: true; user: User } | { success: false; error: string }> {
  try {
    const response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    const payload = await parseJson<AuthResponse | AuthErrorResponse>(response);
    if (!response.ok || !payload || !("accessToken" in payload)) {
      setAccessToken(null);
      return {
        success: false,
        error: getErrorMessage(payload, fallbackMessage),
      };
    }

    setAccessToken(payload.accessToken);
    return {
      success: true,
      user: normalizeUser(payload.user),
    };
  } catch {
    setAccessToken(null);
    return {
      success: false,
      error: fallbackMessage,
    };
  }
}

function clearLegacyLocalDemoDataOnce() {
  if (localStorage.getItem(LEGACY_RESET_MARKER_KEY) === "true") {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) {
      continue;
    }

    const shouldRemove =
      LEGACY_STORAGE_KEYS.has(key) ||
      LEGACY_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));

    if (shouldRemove) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(LEGACY_RESET_MARKER_KEY, "true");
}

async function tryRefreshSession(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const result = await authRequest(
      "/api/auth/refresh",
      { method: "POST" },
      "Unable to restore your session.",
    );

    if (!result.success) {
      return false;
    }

    clearLegacyLocalDemoDataOnce();
    return true;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<Response> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: createRequestHeaders(init),
  });

  if (response.status !== 401) {
    return response;
  }

  if (!allowRefresh) {
    setAccessToken(null);
    return response;
  }

  const refreshed = await tryRefreshSession();
  if (!refreshed) {
    setAccessToken(null);
    return response;
  }

  return apiFetch(path, init, false);
}

export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
  fallbackMessage = "Request failed.",
): Promise<T> {
  const response = await apiFetch(path, init);
  const payload = await parseJson<T | AuthErrorResponse>(response);

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(payload, fallbackMessage));
  }

  return payload as T;
}

export async function apiVoid(
  path: string,
  init: RequestInit = {},
  fallbackMessage = "Request failed.",
): Promise<void> {
  const response = await apiFetch(path, init);
  const payload = await parseJson<AuthErrorResponse>(response);

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(payload, fallbackMessage));
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function fetchCurrentUser(): Promise<User | null> {
  if (!accessToken) {
    return null;
  }

  try {
    const response = await apiFetch("/api/auth/me", {
      method: "GET",
    }, false);

    const payload = await parseJson<ApiUser | AuthErrorResponse>(response);
    if (!response.ok || !payload || !("id" in payload)) {
      if (response.status === 401) {
        setAccessToken(null);
      }
      return null;
    }

    return normalizeUser(payload);
  } catch {
    return null;
  }
}

export async function bootstrapAuth(): Promise<User | null> {
  const refreshed = await tryRefreshSession();
  if (!refreshed) {
    return null;
  }

  const currentUser = await fetchCurrentUser();
  return currentUser;
}

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  const result = await authRequest(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    "Unable to log in right now.",
  );

  if (!result.success) {
    return result;
  }

  clearLegacyLocalDemoDataOnce();
  return {
    success: true,
    user: result.user,
  };
}

export async function register(
  input: RegisterInput,
): Promise<{ success: boolean; user?: User; error?: string }> {
  const result = await authRequest(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Unable to create your account right now.",
  );

  if (!result.success) {
    return result;
  }

  clearLegacyLocalDemoDataOnce();
  return {
    success: true,
    user: result.user,
  };
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } finally {
    setAccessToken(null);
  }
}
