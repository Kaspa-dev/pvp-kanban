import { LoaderCircle, UserRound } from "lucide-react";

import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { getWorkspaceSurfaceStyles } from "../../utils/workspaceSurfaceStyles";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
    <Card
      className={cn(
        "overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-950/10",
        workspaceSurface.elevatedPanelSurfaceClassName,
      )}
    >
      <CardHeader className={cn("space-y-4 border-b px-5 py-5 sm:px-6", currentTheme.border)}>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br",
            currentTheme.primaryText,
            currentTheme.primaryBorder,
            currentTheme.primarySoftStrong,
          )}
        >
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <CardTitle className={cn("text-2xl font-semibold", currentTheme.text)}>
            Join the planning room
          </CardTitle>
          <CardDescription className={cn("max-w-xl text-sm leading-6", currentTheme.textMuted)}>
            {isAuthenticated
              ? "Your account is ready to enter the shared room. Continue to reconnect to the live session."
              : "Pick the name other participants will see. You can join as a guest through the shared link."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-5 sm:px-6">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          {isAuthenticated ? (
            <div
              className={cn(
                "rounded-2xl border bg-gradient-to-r px-4 py-3 text-sm",
                currentTheme.primaryText,
                currentTheme.primaryBorder,
                currentTheme.primarySoftStrong,
              )}
            >
              Signed in as <span className="font-semibold">{authenticatedLabel}</span>.
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="planning-poker-display-name" className={currentTheme.text}>
                Display name
              </Label>
              <Input
                id="planning-poker-display-name"
                value={displayName}
                onChange={(event) => onDisplayNameChange(event.target.value)}
                placeholder="Enter your display name"
                autoComplete="name"
                maxLength={80}
                className={cn(
                  "h-11 rounded-xl",
                  workspaceSurface.inputSurfaceClassName,
                  currentTheme.text,
                  currentTheme.focus,
                  isDarkMode
                    ? "placeholder:text-zinc-500"
                    : "placeholder:text-zinc-400",
                )}
                aria-invalid={errorMessage ? "true" : "false"}
                aria-describedby="planning-poker-display-name-hint planning-poker-join-error"
              />
              <p
                id="planning-poker-display-name-hint"
                className={cn("text-xs leading-5", currentTheme.textMuted)}
              >
                Keep it short and recognizable so the host can see who has voted.
              </p>
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
            className={cn(
              "h-11 w-full rounded-xl bg-gradient-to-r text-white shadow-lg shadow-black/5",
              currentTheme.primary,
              currentTheme.primaryHover,
            )}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Joining room...
              </>
            ) : (
              "Join room"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
