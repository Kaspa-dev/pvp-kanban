import { FormEventHandler, ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { CustomScrollArea } from "./CustomScrollArea";
import { UtilityIconButton } from "./UtilityIconButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface FormModalFrameProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleAddon?: ReactNode;
  description?: string;
  closeAriaLabel: string;
  children: ReactNode;
  footer: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  noValidate?: boolean;
  maxWidthClassName?: string;
  height?: string;
  scrollBody?: boolean;
  viewportClassName?: string;
  contentClassName?: string;
}

export function FormModalFrame({
  isOpen,
  onClose,
  title,
  titleAddon,
  description,
  closeAriaLabel,
  children,
  footer,
  onSubmit,
  noValidate = false,
  maxWidthClassName = "max-w-4xl",
  height = "min(68rem, calc(100dvh - 2rem))",
  scrollBody = true,
  viewportClassName = "h-full min-h-0 pr-4",
  contentClassName = "px-1 py-1",
}: FormModalFrameProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const headerAlignmentClassName = description ? "items-start" : "items-center";

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const body = (
    <>
      {scrollBody ? (
        <div className="flex-1 min-h-0 overflow-hidden px-6 py-6">
          <CustomScrollArea
            className="h-full min-h-0"
            viewportClassName={viewportClassName}
          >
            <div className={contentClassName}>{children}</div>
          </CustomScrollArea>
        </div>
      ) : (
        <div className="px-6 py-6">
          <div className={contentClassName}>{children}</div>
        </div>
      )}

      <div className={`flex gap-3 p-6 border-t-2 ${currentTheme.border} ${currentTheme.cardBg} shrink-0`}>
        {footer}
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full ${maxWidthClassName} border-2 ${currentTheme.border} animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col`}
        style={{ height: height || undefined }}
      >
        <div className={`z-10 flex ${headerAlignmentClassName} justify-between gap-4 p-6 border-b-2 ${currentTheme.border} ${currentTheme.cardBg} rounded-t-3xl shrink-0`}>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={`text-2xl font-bold ${currentTheme.text}`}>{title}</h2>
              {titleAddon}
            </div>
            {description ? (
              <p className={`text-sm ${currentTheme.textMuted}`}>
                {description}
              </p>
            ) : null}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <UtilityIconButton
                type="button"
                size="md"
                onClick={onClose}
                aria-label={closeAriaLabel}
                className="shrink-0"
              >
                <X className="w-5 h-5" />
              </UtilityIconButton>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>{closeAriaLabel}</TooltipContent>
          </Tooltip>
        </div>

        {onSubmit ? (
          <form noValidate={noValidate} onSubmit={onSubmit} className="flex flex-1 min-h-0 flex-col overflow-hidden">
            {body}
          </form>
        ) : (
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            {body}
          </div>
        )}
      </div>
    </div>
  );
}
