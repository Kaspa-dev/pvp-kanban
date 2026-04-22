import { Crown, UserRound, Vote } from "lucide-react";

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
import type { PlanningPokerParticipant } from "../../utils/planningPoker";

interface PlanningPokerParticipantListProps {
  participants: PlanningPokerParticipant[];
  isRevealed: boolean;
}

export function PlanningPokerParticipantList({
  participants,
  isRevealed,
}: PlanningPokerParticipantListProps) {
  const votedCount = participants.filter((participant) => participant.hasVoted).length;

  return (
    <Card className="border-white/10 bg-slate-900/80 shadow-xl shadow-slate-950/20">
      <CardHeader className="space-y-2">
        <CardTitle className="text-white">Participants</CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-300">
          {votedCount} of {participants.length} ready for the current round.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[22rem] pr-4">
          <ul className="space-y-3">
            {participants.map((participant) => (
              <li
                key={participant.participantId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <AppAvatar
                    username={participant.displayName}
                    fullName={participant.displayName}
                    size={40}
                    className="border border-white/10 shadow-sm"
                    interactive={false}
                    enableBlink={false}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {participant.displayName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {participant.isHost ? (
                        <Badge
                          variant="outline"
                          className="border-amber-300/30 bg-amber-300/10 text-amber-100"
                        >
                          <Crown className="h-3 w-3" aria-hidden="true" />
                          Host
                        </Badge>
                      ) : null}
                      {participant.isGuest ? (
                        <Badge
                          variant="outline"
                          className="border-slate-300/15 bg-slate-800/80 text-slate-200"
                        >
                          <UserRound className="h-3 w-3" aria-hidden="true" />
                          Guest
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    participant.hasVoted
                      ? isRevealed
                        ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
                        : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                      : "border-white/10 bg-slate-900 text-slate-300"
                  }
                  aria-label={
                    participant.hasVoted
                      ? isRevealed
                        ? `${participant.displayName} voted in the revealed round`
                        : `${participant.displayName} has voted`
                      : `${participant.displayName} is still deciding`
                  }
                >
                  <Vote className="h-3 w-3" aria-hidden="true" />
                  {participant.hasVoted
                    ? isRevealed
                      ? participant.revealedCardValue ?? "Voted"
                      : "Ready"
                    : "Waiting"}
                </Badge>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
