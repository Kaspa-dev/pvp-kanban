import { Archive } from "lucide-react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { FormModalFrame } from "./FormModalFrame";
import {
  getPrimaryModalActionButtonClassName,
  getSecondaryModalActionButtonClassName,
} from "./modalActionButtonStyles";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ConfirmConcludeDoneDialogProps {
  isOpen: boolean;
  taskCount: number;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmConcludeDoneDialog({
  isOpen,
  taskCount,
  isSubmitting = false,
  onClose,
  onConfirm,
}: ConfirmConcludeDoneDialogProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const secondaryActionButtonClassName = getSecondaryModalActionButtonClassName(
    currentTheme,
    currentTheme.textSecondary,
  );
  const primaryActionButtonClassName = getPrimaryModalActionButtonClassName(currentTheme);
  const taskLabel = taskCount === 1 ? "task" : "tasks";

  return (
    <FormModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Conclude done tasks"
      closeAriaLabel="Close conclude done tasks dialog"
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
                disabled={isSubmitting}
                className={`flex-1 px-5 py-3 font-semibold ${secondaryActionButtonClassName}`}
              >
                Cancel
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>Keep Done tasks on the board</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting || taskCount <= 0}
                className={`flex-1 px-5 py-3 font-semibold ${primaryActionButtonClassName} ${
                  isSubmitting || taskCount <= 0 ? "cursor-not-allowed opacity-60 hover:scale-100" : ""
                }`}
              >
                {isSubmitting ? "Concluding..." : "Conclude all"}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>Move Done tasks to History</TooltipContent>
          </Tooltip>
        </>
      )}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <span className={`mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${currentTheme.primary} text-white shadow-sm`}>
            <Archive className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-3">
            <p className={`font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              Move {taskCount} Done {taskLabel} to History?
            </p>
            <p className={`text-sm leading-6 ${currentTheme.textSecondary}`}>
              Concluded tasks leave the active board and can be restored from History if needed.
            </p>
          </div>
        </div>
      </div>
    </FormModalFrame>
  );
}
