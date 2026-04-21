export type ActionToastKind = "success" | "error";

export interface ActionToastState {
  id: number;
  kind: ActionToastKind;
  message: string;
}

type ActionToastListener = (toast: ActionToastState | null) => void;

const listeners = new Set<ActionToastListener>();
const DEFAULT_SUCCESS_DURATION_MS = 2600;
const DEFAULT_ERROR_DURATION_MS = 4200;

let activeToast: ActionToastState | null = null;
let dismissTimeoutId: number | null = null;

function notifyListeners() {
  listeners.forEach((listener) => listener(activeToast));
}

function clearDismissTimeout() {
  if (dismissTimeoutId !== null && typeof window !== "undefined") {
    window.clearTimeout(dismissTimeoutId);
  }

  dismissTimeoutId = null;
}

function showActionToast(kind: ActionToastKind, message: string, duration: number) {
  clearDismissTimeout();

  activeToast = {
    id: Date.now(),
    kind,
    message,
  };

  notifyListeners();

  if (typeof window !== "undefined") {
    dismissTimeoutId = window.setTimeout(() => {
      clearActionToast();
    }, duration);
  }
}

export function subscribeToActionToast(listener: ActionToastListener) {
  listeners.add(listener);
  listener(activeToast);

  return () => {
    listeners.delete(listener);
  };
}

export function clearActionToast() {
  clearDismissTimeout();
  activeToast = null;
  notifyListeners();
}

export function showSuccessToast(message: string) {
  showActionToast("success", message, DEFAULT_SUCCESS_DURATION_MS);
}

export function showErrorToast(message: string) {
  showActionToast("error", message, DEFAULT_ERROR_DURATION_MS);
}
