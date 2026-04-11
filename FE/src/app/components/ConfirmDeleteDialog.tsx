import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertTriangle, X } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
}: ConfirmDeleteDialogProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={onClose}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />
        <AlertDialog.Content
          className={`fixed left-1/2 top-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border-2 ${currentTheme.border} ${currentTheme.cardBg} shadow-2xl animate-in zoom-in-95 duration-200`}
        >
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${currentTheme.primarySoftStrong} opacity-80 blur-2xl`} />
          <div className={`flex items-start justify-between gap-4 border-b-2 p-6 ${currentTheme.border} ${currentTheme.cardBg}`}>
            <div className="flex min-w-0 items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${currentTheme.primaryBorder} bg-gradient-to-br ${currentTheme.primarySoftStrong} shadow-sm`}>
                <AlertTriangle className={`h-6 w-6 ${currentTheme.primaryText}`} />
              </div>
              <div className="min-w-0">
                <p className={`mb-1 text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.primaryText}`}>
                  Confirm removal
                </p>
                <AlertDialog.Title className={`text-2xl font-bold ${currentTheme.text}`}>
                  Delete task
                </AlertDialog.Title>
                <p className={`mt-1 text-sm ${currentTheme.textSecondary}`}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className={`${currentTheme.textMuted} hover:${currentTheme.primaryText} rounded-full p-2 transition-colors hover:${currentTheme.primaryBg}`}
                aria-label="Close delete dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </AlertDialog.Cancel>
          </div>

          <div className="p-6">
            <div className={`rounded-2xl border ${currentTheme.primaryBorder} bg-gradient-to-br ${currentTheme.primarySoft} p-4`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.primaryText}`}>
                Task to remove
              </p>
              <p
                title={taskTitle}
                className={`mt-2 overflow-hidden text-ellipsis text-sm font-semibold ${currentTheme.text} line-clamp-2 break-words`}
              >
                "{taskTitle}"
              </p>
              <p className={`mt-3 text-xs leading-5 ${currentTheme.textMuted}`}>
                The task and its details will be permanently removed from this board.
              </p>
            </div>
          </div>

          <div className={`flex gap-3 border-t-2 p-6 ${currentTheme.border} ${currentTheme.cardBg}`}>
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className={`flex-1 rounded-xl border-2 px-5 py-3 font-semibold transition-all ${isDarkMode ? "border-zinc-700 text-zinc-100 hover:bg-zinc-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 rounded-xl bg-gradient-to-r px-5 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.01] ${currentTheme.primary}`}
              >
                Delete task
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
