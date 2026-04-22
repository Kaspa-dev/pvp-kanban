import { CheckCircle2, CircleDot, Crown, Eye, EyeOff, UserRound, Vote } from "lucide-react";

import { useTheme, getThemeColors } from "../../contexts/ThemeContext";
import type { PlanningPokerParticipant } from "../../utils/planningPoker";
import { getWorkspaceSurfaceStyles } from "../../utils/workspaceSurfaceStyles";
import { AppAvatar } from "../AppAvatar";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../ui/utils";

interface PlanningPokerParticipantListProps {
  participants: PlanningPokerParticipant[];
  isRevealed: boolean;
}

function getParticipantVoteState(participant: PlanningPokerParticipant, isRevealed: boolean) {
  if (!participant.hasVoted) {
    return {
      icon: CircleDot,
      label: "Waiting",
      detail: "No vote submitted yet",
      tone: "neutral" as const,
      ariaLabel: `${participant.displayName} is still deciding`,
    };
  }

  if (isRevealed) {
    return {
      icon: Eye,
      label: "Revealed",
      detail: participant.revealedCardValue ?? "Vote shown",
      tone: "revealed" as const,
      ariaLabel: `${participant.displayName} voted and the card is revealed as ${participant.revealedCardValue ?? "shown"}`,
    };
  }

  return {
    icon: Vote,
    label: "Voted",
    detail: "Card hidden until reveal",
    tone: "voted" as const,
    ariaLabel: `${participant.displayName} has voted and is waiting for reveal`,
  };
}

export function PlanningPokerParticipantList({
  participants,
  isRevealed,
}: PlanningPokerParticipantListProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const votedCount = participants.filter((participant) => participant.hasVoted).length;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[2rem] shadow-lg",
        workspaceSurface.elevatedPanelSurfaceClassName,
      )}
    >
      <CardHeader className={`space-y-3 border-b ${currentTheme.border} px-5 py-5 sm:px-6`}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
              currentTheme.border,
              currentTheme.textSecondary,
              isDarkMode ? "bg-slate-950/70" : "bg-white/85",
            )}
          >
            Participant awareness
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              currentTheme.border,
              currentTheme.textSecondary,
              isDarkMode ? "bg-slate-950/70" : "bg-white/85",
            )}
          >
            <Vote className="h-3.5 w-3.5" aria-hidden="true" />
            {votedCount}/{participants.length} voted
          </Badge>
        </div>
        <CardTitle className={`text-xl font-semibold ${currentTheme.text}`}>Participants</CardTitle>
        <CardDescription className={`text-sm leading-6 ${currentTheme.textMuted}`}>
          Lightweight room awareness for who is here, who has voted, and whether cards are still
          hidden or already revealed.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-5 py-5 sm:px-6">
        <ScrollArea className="h-[22rem] pr-4">
          <ul className="space-y-3">
            {participants.map((participant) => {
              const voteState = getParticipantVoteState(participant, isRevealed);
              const VoteStateIcon = voteState.icon;
              const voteStateBadgeClassName =
                voteState.tone === "revealed"
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
                  : voteState.tone === "voted"
                    ? "border-sky-400/30 bg-sky-500/10 text-sky-700 dark:text-sky-100"
                    : cn(
                        currentTheme.border,
                        currentTheme.textSecondary,
                        isDarkMode ? "bg-slate-950/70" : "bg-white/85",
                      );

              return (
                <li
                  key={participant.participantId}
                  className={cn(
                    "rounded-[1.5rem] border px-4 py-4",
                    currentTheme.border,
                    isDarkMode ? "bg-white/[0.03]" : "bg-black/[0.03]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <AppAvatar
                        username={participant.displayName}
                        fullName={participant.displayName}
                        size={40}
                        className="border border-white/10 shadow-sm"
                        interactive={false}
                        enableBlink={false}
                        aria-hidden="true"
                      />

                      <div className="min-w-0 space-y-2">
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>
                            {participant.displayName}
                          </p>
                          <p className={`mt-0.5 text-xs ${currentTheme.textMuted}`}>
                            {participant.isGuest ? "Guest participant" : "Board member"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {participant.isHost ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold",
                                currentTheme.primaryBorder,
                                currentTheme.primaryText,
                                `bg-gradient-to-r ${currentTheme.primarySoftStrong}`,
                              )}
                            >
                              <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                              Host
                            </Badge>
                          ) : null}

                          {participant.isGuest ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold",
                                currentTheme.border,
                                currentTheme.textSecondary,
                                isDarkMode ? "bg-slate-950/70" : "bg-white/85",
                              )}
                            >
                              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                              Guest
                            </Badge>
                          ) : null}

                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              currentTheme.border,
                              currentTheme.textSecondary,
                              isDarkMode ? "bg-slate-950/70" : "bg-white/85",
                            )}
                          >
                            {isRevealed ? (
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            {isRevealed ? "Round open" : "Cards hidden"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        voteStateBadgeClassName,
                      )}
                      aria-label={voteState.ariaLabel}
                    >
                      <VoteStateIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {voteState.label}
                    </Badge>
                  </div>

                  <div
                    className={cn(
                      "mt-3 flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm",
                      currentTheme.border,
                      isDarkMode ? "bg-slate-950/50" : "bg-white/80",
                    )}
                  >
                    {participant.hasVoted ? (
                      isRevealed ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                      ) : (
                        <Vote className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                      )
                    ) : (
                      <CircleDot className={`h-4 w-4 shrink-0 ${currentTheme.textMuted}`} aria-hidden="true" />
                    )}

                    <span className={currentTheme.textMuted}>
                      {participant.hasVoted
                        ? isRevealed
                          ? `Revealed card: ${participant.revealedCardValue ?? voteState.detail}.`
                          : voteState.detail
                        : voteState.detail}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
