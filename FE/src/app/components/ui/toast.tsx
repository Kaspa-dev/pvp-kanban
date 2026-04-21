import * as RadixToast from "@radix-ui/react-toast";
import { CircleCheckBig, ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import {
  clearActionToast,
  subscribeToActionToast,
  type ActionToastState,
} from "../../utils/toast";
import { cn } from "./utils";

function ToastIcon({
  kind,
  isDarkMode,
}: {
  kind: ActionToastState["kind"];
  isDarkMode: boolean;
}) {
  if (kind === "success") {
    return (
      <CircleCheckBig
        className={cn("h-4.5 w-4.5", isDarkMode ? "text-green-400" : "text-green-700")}
        strokeWidth={2.1}
      />
    );
  }

  return (
    <ShieldAlert
      className={cn("h-4.5 w-4.5", isDarkMode ? "text-red-400" : "text-red-700")}
      strokeWidth={2.1}
    />
  );
}

export function Toaster() {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const [toast, setToast] = useState<ActionToastState | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeToActionToast(setToast), []);

  useEffect(() => {
    setOpen(Boolean(toast));
  }, [toast]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      clearActionToast();
    }
  };

  return (
    <RadixToast.Provider swipeDirection="right">
      {toast ? (
        <RadixToast.Root
          key={toast.id}
          open={open}
          onOpenChange={handleOpenChange}
          className={cn(
            "group pointer-events-auto relative grid w-[22.75rem] grid-cols-[auto_1fr] items-start gap-x-3 overflow-hidden rounded-2xl border px-4 py-3.5 shadow-[0_16px_34px_rgba(15,23,42,0.12)] outline-none",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-full",
            "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0",
            "data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full",
            currentTheme.cardBg,
            currentTheme.text,
            currentTheme.border,
          )}
        >
          <div className="flex items-start pt-0.5">
            <ToastIcon kind={toast.kind} isDarkMode={isDarkMode} />
          </div>

          <div className="min-w-0 pr-8 pt-0.5">
            <RadixToast.Title className={cn("font-toast-title text-[13px] font-extrabold tracking-[-0.01em]", currentTheme.text)}>
              {toast.message}
            </RadixToast.Title>
          </div>

          <RadixToast.Close
            aria-label="Dismiss notification"
            className={cn(
              "absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
              currentTheme.border,
              currentTheme.cardBg,
              currentTheme.textMuted,
              currentTheme.accentIconButtonHover,
            )}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.2} />
          </RadixToast.Close>
        </RadixToast.Root>
      ) : null}

      <RadixToast.Viewport className="fixed bottom-4 right-4 z-[120] flex max-w-[calc(100vw-2rem)] list-none flex-col gap-2 outline-none sm:bottom-6 sm:right-6" />
    </RadixToast.Provider>
  );
}
