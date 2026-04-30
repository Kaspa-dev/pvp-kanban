import { useMemo } from "react";
import { Copy, ExternalLink, LoaderCircle, ListTodo, Trash2, Users } from "lucide-react";

import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { UtilityIconButton } from "../UtilityIconButton";
import type { PlanningPokerSession } from "../../utils/planningPoker";
import { showErrorToast, showSuccessToast } from "../../utils/toast";

interface PlanningPokerLaunchCardProps {
  session: PlanningPokerSession | null;
  eligibleTaskCount: number;
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  onCreateSession: () => void;
  onDeleteSession: () => void;
}

export function PlanningPokerLaunchCard({
  session,
  eligibleTaskCount,
  isLoading,
  isCreating,
  isDeleting,
  onCreateSession,
  onDeleteSession,
}: PlanningPokerLaunchCardProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const participantCount = session?.participants.length ?? 0;
  const absoluteJoinUrl = useMemo(() => {
    if (!session?.joinUrl) {
      return "";
    }

    return typeof window === "undefined"
      ? session.joinUrl
      : new URL(session.joinUrl, window.location.origin).toString();
  }, [session?.joinUrl]);

  const handleCopyLink = async () => {
    if (!absoluteJoinUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(absoluteJoinUrl);
      showSuccessToast("Join link copied.");
    } catch {
      showErrorToast("Could not copy the join link automatically.");
    }
  };

  const canCreateSession =
    !session && eligibleTaskCount > 0 && !isLoading && !isCreating;

  const buttonBaseClassName = `inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;
  const statItemClassName = `inline-flex items-center gap-2 text-sm ${currentTheme.textSecondary}`;
  const statIconClassName = currentTheme.primaryText;
  const primaryButtonClassName = `group relative overflow-hidden shadow-lg hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99] ${buttonBaseClassName} bg-gradient-to-r text-white ${currentTheme.primary}`;
  const utilityTextButtonClassName = "h-11 w-auto gap-2 px-3.5 text-sm font-medium";

  return (
    <section
      aria-labelledby="planning-poker-launch-card-title"
      className={`${currentTheme.cardBg} rounded-2xl border ${currentTheme.border} px-5 py-4 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.35)]`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h2
            id="planning-poker-launch-card-title"
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${currentTheme.primaryBg} ${currentTheme.primaryText}`}
          >
            Active Planning Poker Session
          </h2>

          <div className={statItemClassName}>
            <ListTodo className={`h-4 w-4 ${statIconClassName}`} aria-hidden="true" />
            <span className="font-medium">{eligibleTaskCount}</span>
          </div>

          <div className={statItemClassName}>
            <Users className={`h-4 w-4 ${statIconClassName}`} aria-hidden="true" />
            <span className="font-medium">{participantCount}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {session ? (
            <>
              {session.isCurrentUserHost ? (
                <UtilityIconButton
                  type="button"
                  onClick={onDeleteSession}
                  disabled={isDeleting}
                  aria-label={isDeleting ? "Deleting planning poker session" : "Delete planning poker session"}
                  className="h-11 w-11"
                >
                  {isDeleting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </UtilityIconButton>
              ) : null}
              <UtilityIconButton
                type="button"
                onClick={() => void handleCopyLink()}
                className={utilityTextButtonClassName}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                <span>Copy link</span>
              </UtilityIconButton>
              <a
                href={session.joinUrl}
                className={primaryButtonClassName}
              >
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.24)_50%,transparent_85%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10 inline-flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110" aria-hidden="true" />
                  <span>Open room</span>
                </span>
              </a>
            </>
          ) : (
            <button
              type="button"
              onClick={onCreateSession}
              disabled={!canCreateSession}
              className={`${primaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.24)_50%,transparent_85%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10 inline-flex items-center gap-2">
                <span>{isCreating ? "Creating session..." : "Launch planning poker"}</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
