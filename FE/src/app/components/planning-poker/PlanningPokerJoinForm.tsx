import { LoaderCircle, UserRound } from "lucide-react";

import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { getWorkspaceSurfaceStyles } from "../../utils/workspaceSurfaceStyles";
import { getNativeInputFieldClassName } from "../inputLikeControlStyles";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

interface PlanningPokerJoinFormProps {
  displayName: string;
  isAuthenticated: boolean;
  authenticatedLabel?: string;
  isSubmitting: boolean;
  errorMessage: string;
  onDisplayNameChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
}

export function PlanningPokerJoinForm({
  displayName,
  isAuthenticated,
  authenticatedLabel,
  isSubmitting,
  errorMessage,
  onDisplayNameChange,
  onSubmit,
}: PlanningPokerJoinFormProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border px-5 py-5 shadow-[0_28px_90px_-54px_rgba(15,23,42,0.62)] sm:px-6 sm:py-6",
        workspaceSurface.elevatedPanelSurfaceClassName,
      )}
      aria-labelledby="planning-poker-join-title"
    >
      <div className={`pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} />
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br ${currentTheme.primarySoftStrong} ${currentTheme.primaryBorder} ${currentTheme.primaryText}`}>
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 id="planning-poker-join-title" className={`font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              Join room
            </h1>
            <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
              {isAuthenticated ? "Continue with your account." : "Enter the name shown at the table."}
            </p>
          </div>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          {isAuthenticated ? (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${currentTheme.primaryBorder} ${currentTheme.primaryText} ${isDarkMode ? "bg-white/[0.04]" : "bg-white/82"}`}>
              Continuing as <span className="font-semibold">{authenticatedLabel}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="planning-poker-display-name" className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                Display name
              </label>
              <input
                id="planning-poker-display-name"
                value={displayName}
                onChange={(event) => onDisplayNameChange(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                maxLength={80}
                className={cn(
                  "h-12 w-full px-4 text-sm",
                  getNativeInputFieldClassName(currentTheme, {
                    surfaceClassName: workspaceSurface.inputSurfaceClassName,
                  }),
                  isDarkMode ? "placeholder:text-zinc-500" : "placeholder:text-zinc-400",
                )}
                aria-invalid={errorMessage ? "true" : "false"}
                aria-describedby={errorMessage ? "planning-poker-join-error" : undefined}
              />
            </div>
          )}

          {errorMessage ? (
            <p
              id="planning-poker-join-error"
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                isDarkMode
                  ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
                  : "border-amber-200 bg-amber-50 text-amber-900",
              )}
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            className={`h-12 w-full rounded-xl bg-gradient-to-r text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 ${currentTheme.primary}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Joining
              </>
            ) : (
              "Join"
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}
