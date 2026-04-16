import { Copy, Crown, LoaderCircle, RadioTower, ShieldCheck } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface PlanningPokerHostPanelProps {
  isHost: boolean;
  joinUrl: string;
  votedCount: number;
  participantCount: number;
  isRevealed: boolean;
  isRevealing: boolean;
  copyFeedback: string;
  statusMessage: string;
  errorMessage: string;
  onCopyLink: () => void;
  onReveal: () => void | Promise<void>;
}

export function PlanningPokerHostPanel({
  isHost,
  joinUrl,
  votedCount,
  participantCount,
  isRevealed,
  isRevealing,
  copyFeedback,
  statusMessage,
  errorMessage,
  onCopyLink,
  onReveal,
}: PlanningPokerHostPanelProps) {
  const canReveal = isHost && !isRevealed && votedCount > 0 && !isRevealing;

  return (
    <Card className="border-white/10 bg-slate-900/80 shadow-xl shadow-slate-950/20">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-white">Room controls</CardTitle>
          {isHost ? (
            <Badge className="bg-amber-300 text-slate-950 hover:bg-amber-200">
              <Crown className="h-3 w-3" aria-hidden="true" />
              Host
            </Badge>
          ) : null}
        </div>
        <CardDescription className="text-sm leading-6 text-slate-300">
          Share the join link with teammates. Reveal is only available for the current host.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <RadioTower className="h-3.5 w-3.5" aria-hidden="true" />
              Participation
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">
              {votedCount}/{participantCount}
            </p>
            <p className="mt-1 text-sm text-slate-400">Participants ready in this round.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Round state
            </div>
            <p className="mt-3 text-lg font-semibold text-white">
              {isRevealed ? "Revealed" : "Voting in progress"}
            </p>
            <p className="mt-1 text-sm text-slate-400">{statusMessage}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
          <label
            htmlFor="planning-poker-share-link"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
          >
            Shared link
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="planning-poker-share-link"
              readOnly
              value={joinUrl}
              className="h-11 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-100"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 border-white/10 bg-slate-900 text-slate-100 hover:bg-slate-800"
              onClick={onCopyLink}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy link
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-400" aria-live="polite">
            {copyFeedback || "Anyone with this link can join as a guest."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        <Button
          type="button"
          disabled={!canReveal}
          onClick={() => void onReveal()}
          className="h-11 w-full rounded-xl bg-white text-slate-950 hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-400"
        >
          {isRevealing ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Revealing votes...
            </>
          ) : isRevealed ? (
            "Votes revealed"
          ) : isHost ? (
            "Reveal votes"
          ) : (
            "Host can reveal votes"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
