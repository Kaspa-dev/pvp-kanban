import {
  CheckCircle2,
  Copy,
  Crown,
  Eye,
  EyeOff,
  LoaderCircle,
  RadioTower,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";

import { useTheme, getThemeColors } from "../../contexts/ThemeContext";
import { getWorkspaceSurfaceStyles } from "../../utils/workspaceSurfaceStyles";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { cn } from "../ui/utils";

interface PlanningPokerHostPanelProps {
  isHost: boolean;
  joinUrl: string;
  votedCount: number;
  participantCount: number;
  isRevealed: boolean;
  isRevealing: boolean;
  isDeleting: boolean;
  copyFeedback: string;
  statusMessage: string;
  errorMessage: string;
  onCopyLink: () => void;
  onReveal: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}

export function PlanningPokerHostPanel({
  isHost,
  joinUrl,
  votedCount,
  participantCount,
  isRevealed,
  isRevealing,
  isDeleting,
  copyFeedback,
  statusMessage,
  errorMessage,
  onCopyLink,
  onReveal,
  onDelete,
}: PlanningPokerHostPanelProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const canReveal = isHost && !isRevealed && votedCount > 0 && !isRevealing;
  const readinessLabel =
    participantCount === 0 ? "No one joined yet" : `${votedCount} of ${participantCount} participants voted`;
  const sharedLinkHint = copyFeedback || "Anyone with this link can join as a guest.";

  const panelClassName = cn(
    "overflow-hidden rounded-[2rem] shadow-lg",
    workspaceSurface.elevatedPanelSurfaceClassName,
  );
  const sectionClassName = cn(
    "rounded-[1.5rem] border px-4 py-4",
    currentTheme.border,
    isDarkMode ? "bg-white/[0.03]" : "bg-black/[0.03]",
  );
  const stateBadgeClassName = cn(
    "px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
    currentTheme.border,
    currentTheme.textSecondary,
    isDarkMode ? "bg-slate-950/70" : "bg-white/85",
  );
  const primaryActionClassName = cn(
    "h-11 w-full rounded-xl bg-gradient-to-r text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60",
    currentTheme.primary,
  );
  const secondaryActionClassName = cn(
    "h-11 w-full rounded-xl border",
    currentTheme.border,
    currentTheme.textSecondary,
    workspaceSurface.controlSurfaceClassName,
  );

  return (
    <Card className={panelClassName}>
      <CardHeader className={`space-y-3 border-b ${currentTheme.border} px-5 py-5 sm:px-6`}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={stateBadgeClassName}>
            Room operations
          </Badge>
          {isHost ? (
            <Badge
              variant="outline"
              className={cn(
                "px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                currentTheme.primaryBorder,
                currentTheme.primaryText,
                `bg-gradient-to-r ${currentTheme.primarySoftStrong}`,
              )}
            >
              <Crown className="h-3.5 w-3.5" aria-hidden="true" />
              Host
            </Badge>
          ) : null}
        </div>
        <CardTitle className={`text-xl font-semibold ${currentTheme.text}`}>Room controls</CardTitle>
        <CardDescription className={`text-sm leading-6 ${currentTheme.textMuted}`}>
          Readiness and round status stay at the top so the host can decide when the room is ready
          to reveal.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-5 sm:px-6">
        <section className={cn(sectionClassName, "space-y-4")} aria-labelledby="planning-poker-room-readiness">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p
                id="planning-poker-room-readiness"
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}
              >
                Readiness
              </p>
              <p className={`text-sm ${currentTheme.textMuted}`}>{readinessLabel}</p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                votedCount === participantCount && participantCount > 0
                  ? `${currentTheme.primaryBorder} ${currentTheme.primaryText} bg-gradient-to-r ${currentTheme.primarySoftStrong}`
                  : `${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-slate-950/70" : "bg-white/85"}`,
              )}
            >
              <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
              {votedCount}/{participantCount}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className={cn(
                "rounded-2xl border px-4 py-3",
                currentTheme.border,
                isDarkMode ? "bg-slate-950/55" : "bg-white/80",
              )}
            >
              <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                <RadioTower className="h-3.5 w-3.5" aria-hidden="true" />
                Participation
              </div>
              <p className={`mt-2 text-2xl font-semibold ${currentTheme.text}`}>{votedCount}</p>
              <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>Votes locked in for this round.</p>
            </div>

            <div
              className={cn(
                "rounded-2xl border px-4 py-3",
                currentTheme.border,
                isDarkMode ? "bg-slate-950/55" : "bg-white/80",
              )}
            >
              <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                {isRevealed ? (
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Round state
              </div>
              <p className={`mt-2 text-base font-semibold ${currentTheme.text}`}>
                {isRevealed ? "Revealed" : "Voting in progress"}
              </p>
              <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>{statusMessage}</p>
            </div>
          </div>
        </section>

        <section className={cn(sectionClassName, "space-y-3")} aria-labelledby="planning-poker-share-link">
          <div className="space-y-1">
            <p
              id="planning-poker-share-link"
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}
            >
              Shared link
            </p>
            <p className={`text-sm ${currentTheme.textMuted}`}>
              Copy the live room link to invite teammates into this session.
            </p>
          </div>

          <div className="space-y-2">
            <Input
              readOnly
              value={joinUrl}
              aria-describedby="planning-poker-share-link-feedback"
              className={cn(
                "h-11 rounded-xl text-sm",
                workspaceSurface.inputSurfaceClassName,
                currentTheme.text,
                currentTheme.focus,
              )}
            />
            <Button
              type="button"
              variant="outline"
              className={secondaryActionClassName}
              onClick={onCopyLink}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy link
            </Button>
          </div>

          <p
            id="planning-poker-share-link-feedback"
            className={`text-xs ${currentTheme.textMuted}`}
            aria-live="polite"
          >
            {sharedLinkHint}
          </p>
        </section>

        {errorMessage ? (
          <div
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm",
              isDarkMode ? "border-rose-400/30 bg-rose-500/10 text-rose-100" : "border-rose-200 bg-rose-50 text-rose-700",
            )}
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}

        <section className={cn(sectionClassName, "space-y-3")} aria-labelledby="planning-poker-reveal-action">
          <div className="space-y-1">
            <p
              id="planning-poker-reveal-action"
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}
            >
              Reveal votes
            </p>
            <p className={`text-sm ${currentTheme.textMuted}`}>
              Reveal becomes available once at least one participant has voted.
            </p>
          </div>

          <Button
            type="button"
            disabled={!canReveal}
            onClick={() => void onReveal()}
            className={primaryActionClassName}
          >
            {isRevealing ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Revealing votes...
              </>
            ) : isRevealed ? (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Votes revealed
              </>
            ) : isHost ? (
              <>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Reveal votes
              </>
            ) : (
              <>
                <Crown className="h-4 w-4" aria-hidden="true" />
                Host can reveal votes
              </>
            )}
          </Button>
        </section>

        <section className={cn(sectionClassName, "space-y-3")} aria-labelledby="planning-poker-delete-action">
          <div className="space-y-1">
            <p
              id="planning-poker-delete-action"
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}
            >
              Delete session
            </p>
            <p className={`text-sm ${currentTheme.textMuted}`}>
              Closing the room ends live collaboration for everyone in this session.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={!isHost || isDeleting}
            onClick={() => void onDelete()}
            className={cn(
              "h-11 w-full rounded-xl border",
              !isHost || isDeleting
                ? `${currentTheme.border} ${workspaceSurface.controlSurfaceClassName} ${currentTheme.textMuted}`
                : isDarkMode
                  ? "border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
                  : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
            )}
          >
            {isDeleting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Deleting session...
              </>
            ) : isHost ? (
              <>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete session
              </>
            ) : (
              <>
                <Crown className="h-4 w-4" aria-hidden="true" />
                Host can delete session
              </>
            )}
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}
