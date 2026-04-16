import { useParams } from "react-router";

export function PlanningPokerRoom() {
  const { joinToken } = useParams();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Planning Poker
        </p>
        <h1 className="text-3xl font-semibold text-white">Room placeholder</h1>
        <p className="text-sm leading-6 text-slate-300">
          The live planning poker room UI is being added next. This route is ready and the
          join token has been captured for the upcoming room experience.
        </p>
        <p className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
          Join token: <span className="font-mono">{joinToken ?? "missing"}</span>
        </p>
      </div>
    </main>
  );
}
