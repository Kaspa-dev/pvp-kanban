import { CheckCircle2, LoaderCircle } from "lucide-react";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { cn } from "../ui/utils";

interface PlanningPokerVoteDeckProps {
  cardValues: number[];
  selectedValue: number | null;
  isSubmitting: boolean;
  isRevealed: boolean;
  disabled: boolean;
  onVote: (value: number) => void | Promise<void>;
}

export function PlanningPokerVoteDeck({
  cardValues,
  selectedValue,
  isSubmitting,
  isRevealed,
  disabled,
  onVote,
}: PlanningPokerVoteDeckProps) {
  return (
    <Card className="border-white/10 bg-slate-900/80 shadow-xl shadow-slate-950/20">
      <CardHeader className="space-y-2">
        <CardTitle className="text-white">Vote deck</CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-300">
          Choose a story point card. Your latest selection replaces any earlier vote.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {cardValues.map((value) => {
            const isSelected = selectedValue === value;

            return (
              <Button
                key={value}
                type="button"
                variant="outline"
                disabled={disabled || isSubmitting}
                onClick={() => void onVote(value)}
                aria-pressed={isSelected}
                className={cn(
                  "h-18 rounded-2xl border-white/10 bg-slate-950/60 text-lg font-semibold text-slate-100 transition-all hover:border-cyan-300/60 hover:bg-slate-900 hover:text-white",
                  "focus-visible:ring-cyan-300/60",
                  isSelected &&
                    "border-cyan-300 bg-cyan-400/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.35)]",
                )}
              >
                <span className="sr-only">{isSelected ? "Selected card " : "Vote "}</span>
                {value}
              </Button>
            );
          })}
        </div>

        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm",
            isRevealed
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
              : "border-white/10 bg-slate-950/60 text-slate-300",
          )}
          aria-live="polite"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving your vote...
            </span>
          ) : isRevealed ? (
            "Voting is locked because the current round has been revealed."
          ) : selectedValue !== null ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Card {selectedValue} selected.
            </span>
          ) : (
            "No card selected yet."
          )}
        </div>
      </CardContent>
    </Card>
  );
}
