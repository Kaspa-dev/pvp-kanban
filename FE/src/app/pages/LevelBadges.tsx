import { Link } from "react-router";
import {
  getLevelTier,
  LevelBadgeAvatar,
  LEVEL_BADGE_VARIANTS,
  type LevelBadgeVariant,
} from "../components/LevelBadgeAvatar";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";

const SAMPLE_LEVELS = [1, 5, 10, 20, 35, 50, 75, 100];
const SAMPLE_USERS = [
  "juniper",
  "mako",
  "vesper",
  "orbit",
  "kestrel",
  "copper",
  "nova",
  "myth",
];

function getSamplePrestige(level: number) {
  if (level >= 100) {
    return 4;
  }

  if (level >= 75) {
    return 3;
  }

  if (level >= 50) {
    return 2;
  }

  if (level >= 20) {
    return 1;
  }

  return 0;
}

export function LevelBadges() {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const pageBgClassName = isDarkMode
    ? "bg-[radial-gradient(circle_at_top_left,rgba(39,39,42,0.92),#09090b_42%,#050505_100%)]"
    : "bg-[radial-gradient(circle_at_top_left,rgba(248,250,252,1),#eef2f7_44%,#e2e8f0_100%)]";
  const panelClassName = `${isDarkMode ? "border-zinc-800 bg-zinc-950/72" : "border-slate-200 bg-white/82"} shadow-[0_24px_90px_-56px_rgba(15,23,42,0.55)]`;
  const mutedTextClassName = currentTheme.textMuted;

  return (
    <main className={`min-h-screen px-5 py-8 ${pageBgClassName}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className={`rounded-[2rem] border p-6 backdrop-blur-xl sm:p-8 ${panelClassName}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className={`text-xs font-bold uppercase tracking-[0.28em] ${currentTheme.primaryText}`}>
                Level badge lab
              </p>
              <h1 className={`mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl ${currentTheme.text}`}>
                Identicon level treatments
              </h1>
              <p className={`mt-4 max-w-2xl text-sm leading-6 sm:text-base ${currentTheme.textSecondary}`}>
                Static playground for comparing compact level and prestige treatments before we attach them to real
                users across task cards, assignee chips, and leaderboard surfaces.
              </p>
            </div>
            <Link
              to="/"
              className={`inline-flex w-fit items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5 ${currentTheme.border} ${currentTheme.bgSecondary} ${currentTheme.text}`}
            >
              Back to app
            </Link>
          </div>
        </header>

        <section className={`rounded-[2rem] border p-4 backdrop-blur-xl sm:p-5 ${panelClassName}`}>
          <div
            className="grid min-w-0 gap-3"
            style={{ gridTemplateColumns: "minmax(8rem, 0.74fr) repeat(4, minmax(10.5rem, 1fr))" }}
          >
            <div className={`hidden rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] lg:block ${mutedTextClassName}`}>
              Level tier
            </div>
            {LEVEL_BADGE_VARIANTS.map((variant) => (
              <div
                key={variant.key}
                className={`hidden rounded-2xl border px-4 py-3 lg:block ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-slate-50"}`}
              >
                <p className={`text-sm font-black ${currentTheme.text}`}>{variant.label}</p>
                <p className={`mt-1 text-xs leading-5 ${currentTheme.textMuted}`}>{variant.description}</p>
              </div>
            ))}

            {SAMPLE_LEVELS.map((level, rowIndex) => {
              const tier = getLevelTier(level);
              const prestige = getSamplePrestige(level);

              return (
                <div key={level} className="contents">
                  <div className={`rounded-2xl border px-4 py-4 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/70"}`}>
                    <p className={`text-xs font-bold uppercase tracking-[0.18em] ${mutedTextClassName}`}>
                      {tier.name}
                    </p>
                    <p className={`mt-1 text-2xl font-black tracking-[-0.04em] ${currentTheme.text}`}>
                      Level {level}
                    </p>
                    <p className={`mt-1 text-xs font-semibold ${mutedTextClassName}`}>Prestige {prestige}</p>
                  </div>

                  {LEVEL_BADGE_VARIANTS.map((variant) => {
                    const username = `${SAMPLE_USERS[rowIndex]}-${variant.key}`;

                    return (
                      <article
                        key={`${level}-${variant.key}`}
                        className={`flex min-h-48 flex-col items-center justify-center rounded-2xl border px-4 py-5 text-center ${currentTheme.border} ${
                          isDarkMode ? "bg-zinc-900/42" : "bg-white/72"
                        }`}
                      >
                        <LevelBadgeAvatar
                          username={username}
                          level={level}
                          prestige={prestige}
                          variant={variant.key as LevelBadgeVariant}
                          size={74}
                          isDarkMode={isDarkMode}
                        />
                        <p className={`mt-6 text-sm font-black ${currentTheme.text}`}>{variant.label}</p>
                        <p className={`mt-1 text-xs font-semibold ${mutedTextClassName}`}>
                          L{level} / P{prestige}
                        </p>
                      </article>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>

        <section className={`rounded-[2rem] border p-5 ${panelClassName}`}>
          <p className={`text-sm font-bold ${currentTheme.text}`}>Reading notes</p>
          <div className={`mt-3 grid gap-3 text-sm leading-6 md:grid-cols-3 ${currentTheme.textSecondary}`}>
            <p>Every sample exposes level and prestige as text, so the badge never depends on color alone.</p>
            <p>Prestige is intentionally visible as a small mark plus ring treatment, not just a stronger hue.</p>
            <p>The identicons use deterministic mock usernames, so style changes can be compared without avatar drift.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
