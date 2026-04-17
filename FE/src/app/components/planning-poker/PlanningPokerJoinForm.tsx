import { LoaderCircle, UserRound } from "lucide-react";

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
  return (
    <Card className="border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/20 backdrop-blur">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-100">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold text-white">
            Join the planning room
          </CardTitle>
          <CardDescription className="max-w-xl text-sm leading-6 text-slate-300">
            {isAuthenticated
              ? "Your account is ready to enter the shared room. Continue to reconnect to the live session."
              : "Pick the name other participants will see. You can join as a guest through the shared link."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          {isAuthenticated ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              Signed in as <span className="font-semibold">{authenticatedLabel}</span>.
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="planning-poker-display-name" className="text-slate-100">
                Display name
              </Label>
              <Input
                id="planning-poker-display-name"
                value={displayName}
                onChange={(event) => onDisplayNameChange(event.target.value)}
                placeholder="Enter your display name"
                autoComplete="name"
                maxLength={80}
                className="h-11 border-white/10 bg-slate-950/70 text-slate-50 placeholder:text-slate-500"
                aria-invalid={errorMessage ? "true" : "false"}
                aria-describedby="planning-poker-display-name-hint planning-poker-join-error"
              />
              <p
                id="planning-poker-display-name-hint"
                className="text-xs leading-5 text-slate-400"
              >
                Keep it short and recognizable so the host can see who has voted.
              </p>
            </div>
          )}

          {errorMessage ? (
            <p
              id="planning-poker-join-error"
              className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400"
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
