import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { FormModalFrame } from "../FormModalFrame";
import {
  getPrimaryModalActionButtonClassName,
  getSecondaryModalActionButtonClassName,
} from "../modalActionButtonStyles";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface PlanningPokerDeleteSessionDialogProps {
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function PlanningPokerDeleteSessionDialog({
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: PlanningPokerDeleteSessionDialogProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const secondaryActionButtonClassName = getSecondaryModalActionButtonClassName(
    currentTheme,
    currentTheme.textSecondary,
  );
  const primaryActionButtonClassName = getPrimaryModalActionButtonClassName(currentTheme);

  return (
    <FormModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Delete planning poker session"
      closeAriaLabel="Close delete planning poker session dialog"
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
                disabled={isDeleting}
                className={`flex-1 px-5 py-3 font-semibold ${secondaryActionButtonClassName}`}
              >
                Cancel
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Close without deleting the session
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => void onConfirm()}
                disabled={isDeleting}
                className={`flex-1 px-5 py-3 font-semibold ${primaryActionButtonClassName}`}
              >
                {isDeleting ? "Deleting..." : "Delete session"}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Permanently delete this planning poker session
            </TooltipContent>
          </Tooltip>
        </>
      )}
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <p className={`text-lg font-semibold ${currentTheme.text}`}>
            You&apos;re about to permanently delete this planning poker session.
          </p>
          <p className={`text-sm leading-6 ${currentTheme.textSecondary}`}>
            This will remove the current session together with all votes, participants, and recommendations. This action cannot be undone.
          </p>
        </div>

        <div className={`rounded-2xl border-2 px-4 py-4 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
          <p className={`text-sm leading-6 ${currentTheme.textSecondary}`}>
            Anyone in the shared room will be disconnected immediately and won&apos;t be able to recover this round after it is deleted.
          </p>
        </div>
      </div>
    </FormModalFrame>
  );
}
