import * as AlertDialog from "@radix-ui/react-alert-dialog";
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
  taskTitle 
}: ConfirmDeleteDialogProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={onClose}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <AlertDialog.Content className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full max-w-md p-8 border-2 ${currentTheme.border} z-50 animate-in zoom-in-95 fade-in duration-200`}>
          <AlertDialog.Title className={`text-2xl font-bold ${currentTheme.text} mb-3`}>
            Delete task?
          </AlertDialog.Title>
          <AlertDialog.Description className={`${currentTheme.textSecondary} mb-6`}>
            Are you sure you want to delete <span className="font-semibold">"{taskTitle}"</span>? This action cannot be undone.
          </AlertDialog.Description>
          
          <div className="flex gap-3">
            <AlertDialog.Cancel asChild>
              <button className={`flex-1 px-5 py-3 border-2 ${currentTheme.border} ${currentTheme.textSecondary} font-semibold rounded-xl hover:${currentTheme.bgSecondary} transition-all`}>
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className={`flex-1 px-5 py-3 ${currentTheme.isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white font-semibold rounded-xl transition-all shadow-lg`}
              >
                Delete
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
