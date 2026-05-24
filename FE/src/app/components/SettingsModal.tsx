import type { LucideIcon } from "lucide-react";
import { ChevronRight, ClipboardList, HelpCircle, User } from "lucide-react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { FormModalFrame } from "./FormModalFrame";
import { PreferencesSettingsSections } from "./PreferencesSettingsSections";
import { getPrimaryModalActionButtonClassName } from "./modalActionButtonStyles";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
  onOpenMyTasks?: () => void;
}

type ThemeColors = ReturnType<typeof getThemeColors>;

interface AccountActionRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  currentTheme: ThemeColors;
  isDarkMode: boolean;
}

function AccountActionRow({
  icon: Icon,
  title,
  description,
  onClick,
  currentTheme,
  isDarkMode,
}: AccountActionRowProps) {
  const surfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-gray-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between gap-4 rounded-xl border-2 p-4 text-left transition-[border-color,box-shadow,color,background-color,transform] duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.inputBorder} ${surfaceClassName} hover:${currentTheme.borderHover} hover:shadow-[0_14px_34px_-30px_rgba(15,23,42,0.45)]`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${currentTheme.primary} shadow-md`}>
          <Icon className="h-5 w-5 text-white" />
        </span>
        <span className="min-w-0">
          <span className={`block font-semibold ${currentTheme.text}`}>{title}</span>
          <span className={`mt-0.5 block text-xs ${currentTheme.textMuted}`}>{description}</span>
        </span>
      </span>
      <ChevronRight className={`h-5 w-5 shrink-0 ${currentTheme.textMuted} transition-transform duration-300 group-hover:translate-x-0.5`} />
    </button>
  );
}

export function SettingsModal({ isOpen, onClose, onOpenProfile, onOpenMyTasks }: SettingsModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const primaryActionButtonClassName = getPrimaryModalActionButtonClassName(currentTheme);
  const sectionTitleClassName = `font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`;
  const sectionDescriptionClassName = `text-sm ${currentTheme.textMuted}`;
  const helpIconButtonClassName = `inline-flex h-5 w-5 items-center justify-center rounded-full ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;
  const sectionDividerClassName = isDarkMode
    ? "h-px rounded-full bg-zinc-800"
    : "h-px rounded-full bg-gray-200";

  const accountRows = [
    onOpenProfile
      ? {
          icon: User,
          title: "Profile",
          description: "Review your account details, XP progress, and milestones.",
          onClick: () => {
            onOpenProfile();
            onClose();
          },
        }
      : null,
    onOpenMyTasks
      ? {
          icon: ClipboardList,
          title: "My Tasks",
          description: "Review tasks assigned to you across boards.",
          onClick: () => {
            onOpenMyTasks();
            onClose();
          },
        }
      : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <FormModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      description="Adjust appearance, hints, and account shortcuts."
      closeAriaLabel="Close settings"
      maxWidthClassName="max-w-2xl"
      height="min(52rem, calc(100dvh - 2rem))"
      viewportClassName="h-full min-h-0 pr-4"
      contentClassName="space-y-6 px-1 py-1"
      footer={(
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClose}
              className={`w-full ${primaryActionButtonClassName}`}
            >
              Done
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>Close settings</TooltipContent>
        </Tooltip>
      )}
    >
      <PreferencesSettingsSections />

      {accountRows.length > 0 ? (
        <>
          <div className={`-mx-1 ${sectionDividerClassName}`} aria-hidden="true" />

          <section className="space-y-4" aria-labelledby="global-settings-account-heading">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className={`h-4 w-4 ${currentTheme.primaryText}`} />
                <h3 id="global-settings-account-heading" className={sectionTitleClassName}>
                  Account
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className={helpIconButtonClassName} aria-label="Account settings help">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    Open account-level pages without losing your current theme and hint preferences.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className={sectionDescriptionClassName}>
                Jump to personal workspace pages from the current screen.
              </p>
            </div>

            <div className="space-y-3">
              {accountRows.map((row) => (
                <AccountActionRow
                  key={row.title}
                  icon={row.icon}
                  title={row.title}
                  description={row.description}
                  onClick={row.onClick}
                  currentTheme={currentTheme}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </FormModalFrame>
  );
}
