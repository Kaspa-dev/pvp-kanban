import { X, AlertTriangle } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Board } from "../utils/boards";

interface ConfirmDeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardDeleted: (boardId: number) => void | Promise<void>;
  board: Board | null;
}

export function ConfirmDeleteProjectDialog({
  isOpen,
  onClose,
  onBoardDeleted,
  board,
}: ConfirmDeleteProjectDialogProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  if (!isOpen || !board) return null;

  const handleConfirm = async () => {
    await onBoardDeleted(board.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative ${currentTheme.cardBg} rounded-2xl shadow-2xl max-w-md w-full border-2 ${currentTheme.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${currentTheme.text} mb-1`}>
                Delete Project
              </h2>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${currentTheme.bgSecondary} rounded-lg hover:${currentTheme.bgTertiary} transition-colors`}
          >
            <X className={`w-5 h-5 ${currentTheme.textSecondary}`} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className={`${currentTheme.bgSecondary} rounded-xl p-4 mb-6 border ${currentTheme.border}`}>
            <p className={`text-sm ${currentTheme.text} mb-2`}>
              Are you sure you want to delete <span className="font-bold text-red-500">"{board.name}"</span>?
            </p>
            <p className={`text-xs ${currentTheme.textMuted}`}>
              All tasks, labels, and sprint data associated with this project will be permanently deleted.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-3 ${currentTheme.bgSecondary} ${currentTheme.text} font-semibold rounded-xl hover:${currentTheme.bgTertiary} transition-all border ${currentTheme.border}`}
            >
              Cancel
            </button>
            <button
              onClick={() => void handleConfirm()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              Delete Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
