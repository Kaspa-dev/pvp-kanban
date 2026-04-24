import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  LoaderCircle,
  RadioTower,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import type { PlanningPokerSession } from "../../utils/planningPoker";

interface PlanningPokerLaunchCardProps {
  session: PlanningPokerSession | null;
  eligibleTaskCount: number;
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  onCreateSession: () => void;
  onRefreshSession: () => void;
  onDeleteSession: () => void;
}

export function PlanningPokerLaunchCard({
  session,
  eligibleTaskCount,
  isLoading,
  isCreating,
  isDeleting,
  onCreateSession,
  onRefreshSession,
  onDeleteSession,
}: PlanningPokerLaunchCardProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const [copyFeedback, setCopyFeedback] = useState("");

  const participantCount = session?.participants.length ?? 0;
  const absoluteJoinUrl = useMemo(() => {
    if (!session?.joinUrl) {
      return "";
    }

    return typeof window === "undefined"
      ? session.joinUrl
      : new URL(session.joinUrl, window.location.origin).toString();
  }, [session?.joinUrl]);

  useEffect(() => {
    if (!copyFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyFeedback(""), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [copyFeedback]);

  const handleCopyLink = async () => {
    if (!absoluteJoinUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(absoluteJoinUrl);
      setCopyFeedback("Join link copied.");
    } catch {
      setCopyFeedback("Could not copy automatically. You can still copy the link manually.");
    }
  };

  const canCreateSession =
    !session && eligibleTaskCount > 0 && !isLoading && !isCreating;

  const primaryButtonClassName = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;
  const secondaryButtonClassName = `${primaryButtonClassName} border ${currentTheme.border} ${currentTheme.textSecondary} ${
    isDarkMode ? "bg-white/[0.04] hover:bg-white/[0.08]" : "bg-white/75 hover:bg-white"
  }`;

  return (
    <section
      aria-labelledby="planning-poker-launch-card-title"
      className={`${currentTheme.cardBg} rounded-[28px] border ${currentTheme.border} p-6 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.55)]`}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${currentTheme.primarySoftStrong}`}>
              <RadioTower className={`h-6 w-6 ${currentTheme.primaryText}`} aria-hidden="true" />
            </div>
            <div>
              <h2 id="planning-poker-launch-card-title" className={`text-xl font-bold ${currentTheme.text}`}>
                Planning Poker
              </h2>
              <p className={`text-sm ${currentTheme.textMuted}`}>
                Launch a live estimation room for backlog tasks that still need story points.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className={`rounded-2xl border px-4 py-3 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                Eligible backlog tasks
              </p>
              <p className={`mt-1 text-2xl font-bold ${currentTheme.text}`}>{eligibleTaskCount}</p>
            </div>

            <div className={`rounded-2xl border px-4 py-3 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                Session status
              </p>
              <p className={`mt-1 text-base font-semibold ${currentTheme.text}`}>
                {session ? session.status : "No active session"}
              </p>
            </div>

            {session ? (
              <div className={`rounded-2xl border px-4 py-3 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                  Participants
                </p>
                <p className={`mt-1 text-2xl font-bold ${currentTheme.text}`}>{participantCount}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {session ? (
            <>
              <button
                type="button"
                onClick={onRefreshSession}
                disabled={isLoading}
                className={secondaryButtonClassName}
              >
                {isLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                )}
                Refresh
              </button>
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className={secondaryButtonClassName}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy link
              </button>
              <a
                href={session.joinUrl}
                className={`${primaryButtonClassName} bg-gradient-to-r text-white ${currentTheme.primary}`}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open room
              </a>
              {session.isCurrentUserHost ? (
                <button
                  type="button"
                  onClick={onDeleteSession}
                  disabled={isDeleting}
                  className={`${primaryButtonClassName} border border-rose-300/30 bg-rose-500/10 text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 ${isDarkMode ? "hover:bg-rose-500/20" : "hover:bg-rose-50"}`}
                >
                  {isDeleting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isDeleting ? "Deleting..." : "Delete session"}
                </button>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              onClick={onCreateSession}
              disabled={!canCreateSession}
              className={`${primaryButtonClassName} bg-gradient-to-r text-white disabled:cursor-not-allowed disabled:opacity-60 ${currentTheme.primary}`}
            >
              {isCreating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RadioTower className="h-4 w-4" aria-hidden="true" />
              )}
              {isCreating ? "Creating session..." : "Launch planning poker"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {!session && (
          <div className={`rounded-[24px] border px-5 py-5 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
            <p className={`text-sm leading-6 ${currentTheme.textMuted}`}>
              Starting a session snapshots every backlog task that still has no story points. Team voting, reveal,
              and guest participation all happen in the dedicated planning poker room.
            </p>
            {eligibleTaskCount === 0 ? (
              <p className={`mt-3 text-sm font-medium ${currentTheme.textSecondary}`}>
                Add or unestimate backlog tasks before launching a session.
              </p>
            ) : null}
          </div>
        )}

        {(copyFeedback || session) && (
          <p className={`text-sm ${currentTheme.textMuted}`} aria-live="polite">
            {copyFeedback || "Anyone with the shared link can join the live room as a guest."}
          </p>
        )}
      </div>
    </section>
  );
}
