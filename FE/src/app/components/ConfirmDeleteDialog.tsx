import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { FormModalFrame } from "./FormModalFrame";
import {
  getSecondaryModalActionButtonClassName,
} from "./modalActionButtonStyles";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

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
  const secondaryActionButtonClassName = getSecondaryModalActionButtonClassName(
    currentTheme,
    currentTheme.textSecondary,
  );
  const destructiveActionButtonClassName = `inline-flex h-11 items-center justify-center leading-none rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-5 font-semibold text-white shadow-lg transition-all duration-500 ease-out hover:scale-[1.03] hover:shadow-2xl hover:brightness-105 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg disabled:hover:brightness-100 ${currentTheme.focus}`;
  const safeTaskTitle = taskTitle.trim() || "Untitled task";

  return (
    <FormModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Delete task"
      closeAriaLabel="Close delete task dialog"
      maxWidthClassName="max-w-xl"
      height=""
      scrollBody={false}
      contentClassName="px-1 py-1"
      footer={(
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-5 py-3 font-semibold ${secondaryActionButtonClassName}`}
              >
                Cancel
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>Close without deleting the task</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 px-5 py-3 font-semibold ${destructiveActionButtonClassName}`}
              >
                Delete task
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>Permanently delete this task</TooltipContent>
          </Tooltip>
        </>
      )}
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <p className={`text-lg font-semibold ${currentTheme.text}`}>
            You&apos;re about to permanently delete this task.
          </p>
          <p className={`text-sm leading-6 ${currentTheme.textSecondary}`}>
            This will remove the task from the board together with its current details. This action cannot be undone.
          </p>
        </div>

        <div>
          <p
            title={safeTaskTitle}
            className={`max-w-[32rem] break-words text-2xl font-bold leading-tight tracking-[-0.02em] sm:text-[1.75rem] ${currentTheme.text}`}
          >
            {safeTaskTitle}
          </p>
        </div>
      </div>
    </FormModalFrame>
  );
}
