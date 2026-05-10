import { Link } from "react-router";
import {
  getLevelTier,
  LevelBadgeAvatar,
  LEVEL_BADGE_VARIANTS,
} from "../components/LevelBadgeAvatar";
import { RailCornersLevelFrame } from "../components/RailCornersLevelFrame";
import { NorthStarLevelFrame } from "../components/NorthStarLevelFrame";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { LEVEL_MARKER_VARIANTS } from "../utils/levelBadges";
import { AppAvatar } from "../components/AppAvatar";
import { getPanelEyebrowClassName } from "../components/typographyStyles";

const SAMPLE_LEVELS = [5, 25, 50, 85, 120, 150];
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

function getSampleUsername(index: number) {
  const seed = SAMPLE_USERS[index % SAMPLE_USERS.length];
  return `${seed}-${index + 1}`;
}

export function LevelBadges() {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const pageBgClassName = isDarkMode
    ? "bg-[radial-gradient(circle_at_top_left,rgba(39,39,42,0.92),#09090b_42%,#050505_100%)]"
    : "bg-[radial-gradient(circle_at_top_left,rgba(248,250,252,1),#eef2f7_44%,#e2e8f0_100%)]";
  const panelClassName = `${isDarkMode ? "border-zinc-800 bg-zinc-950/72" : "border-slate-200 bg-white/82"} shadow-[0_24px_90px_-56px_rgba(15,23,42,0.55)]`;
  const mutedTextClassName = currentTheme.textMuted;
  const mutedEyebrowClassName = getPanelEyebrowClassName(mutedTextClassName);
  const primaryEyebrowClassName = getPanelEyebrowClassName(currentTheme.primaryText);
  const sectionSurfaceClassName = isDarkMode ? "bg-zinc-900/42" : "bg-white/72";

  function renderRingSection() {
    return (
      <section className={`rounded-[2rem] border p-4 backdrop-blur-xl sm:p-5 ${panelClassName}`}>
        <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }}>
          <div>
            <p className={primaryEyebrowClassName}>Ring selection grid</p>
            <h2 className={`font-ui-condensed mt-2 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              Ten ring geometries, same level marker
            </h2>
          </div>
          <p className={`max-w-xl text-sm leading-6 ${currentTheme.textSecondary}`}>
            Each column is a different shape language. Colors and the numeric marker are held steady so the ring silhouette is the only thing competing.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div
            className="grid min-w-[132rem] gap-3"
            style={{ gridTemplateColumns: `minmax(8rem, 0.58fr) repeat(${LEVEL_BADGE_VARIANTS.length}, minmax(11.5rem, 1fr))` }}
          >
          <div className={`hidden rounded-2xl px-4 py-3 lg:block ${mutedEyebrowClassName}`}>
            Color band
          </div>
          {LEVEL_BADGE_VARIANTS.map((variant) => (
            <div
              key={variant.key}
              className={`hidden rounded-2xl border px-4 py-3 lg:block ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-slate-50"}`}
            >
              <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{variant.label}</p>
              <p className={`mt-1 text-xs leading-5 ${currentTheme.textMuted}`}>
                {variant.description}
              </p>
            </div>
          ))}

          {SAMPLE_LEVELS.map((level, rowIndex) => {
            const tier = getLevelTier(level);
            const rangeStart = tier.minLevel;
            const rangeEnd = tier.maxLevel;

            return (
              <div key={`band-${level}`} className="contents">
                <div className={`rounded-2xl border px-4 py-4 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/70"}`}>
                  <p className={mutedEyebrowClassName}>
                    {tier.name}
                  </p>
                  <p className={`font-due-date mt-1 text-2xl font-semibold ${currentTheme.text}`}>
                    {rangeStart}-{rangeEnd}
                  </p>
                  <p className={`mt-1 text-xs font-semibold ${mutedTextClassName}`}>
                    Levels <span className="font-due-date">{rangeStart}</span> to <span className="font-due-date">{rangeEnd}</span>
                  </p>
                </div>

                {LEVEL_BADGE_VARIANTS.map((variant) => (
                  <article
                    key={`${variant.key}-${level}`}
                    className={`flex min-h-52 flex-col items-center justify-center rounded-2xl border px-4 py-5 text-center ${currentTheme.border} ${sectionSurfaceClassName}`}
                  >
                    <LevelBadgeAvatar
                      username={`${getSampleUsername(rowIndex)}-${variant.key}`}
                      level={level}
                      variant={variant.key}
                      size={74}
                      isDarkMode={isDarkMode}
                    />
                    <p className={`font-ui-condensed mt-7 text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{variant.label}</p>
                    <p className={`mt-1 text-xs font-semibold ${mutedTextClassName}`}>
                      Level <span className="font-due-date">{level}</span>
                    </p>
                  </article>
                ))}
              </div>
            );
          })}
        </div>
        </div>
      </section>
    );
  }

  function renderLevelMarkerSection() {
    return (
      <section className={`rounded-[2rem] border p-4 backdrop-blur-xl sm:p-5 ${panelClassName}`}>
        <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }}>
          <div>
            <p className={primaryEyebrowClassName}>Level marker grid</p>
            <h2 className={`font-ui-condensed mt-2 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              Rail Corners, ten level displays
            </h2>
          </div>
          <p className={`max-w-xl text-sm leading-6 ${currentTheme.textSecondary}`}>
            Rail Corners stays fixed here. Only the number marker changes, so we can choose how the level should sit on the avatar.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div
            className="grid min-w-[112rem] gap-3"
            style={{ gridTemplateColumns: `minmax(8rem, 0.58fr) repeat(${LEVEL_MARKER_VARIANTS.length}, minmax(10.5rem, 1fr))` }}
          >
            <div className={`hidden rounded-2xl px-4 py-3 lg:block ${mutedEyebrowClassName}`}>
              Sample
            </div>
            {LEVEL_MARKER_VARIANTS.map((markerVariant) => (
              <div
                key={markerVariant.key}
                className={`hidden rounded-2xl border px-4 py-3 lg:block ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-slate-50"}`}
              >
                <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{markerVariant.label}</p>
                <p className={`mt-1 text-xs leading-5 ${currentTheme.textMuted}`}>
                  {markerVariant.description}
                </p>
              </div>
            ))}

            {[5, 50, 150].map((level, rowIndex) => {
              const tier = getLevelTier(level);

              return (
                <div key={`marker-row-${level}`} className="contents">
                  <div className={`rounded-2xl border px-4 py-4 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/70"}`}>
                    <p className={mutedEyebrowClassName}>
                      {tier.name}
                    </p>
                    <p className={`mt-1 text-2xl font-semibold ${currentTheme.text}`}>
                      Level <span className="font-due-date">{level}</span>
                    </p>
                    <p className={`mt-1 text-xs font-semibold ${mutedTextClassName}`}>Rail Corners base</p>
                  </div>

                  {LEVEL_MARKER_VARIANTS.map((markerVariant) => (
                    <article
                      key={`${markerVariant.key}-${level}`}
                      className={`flex min-h-52 flex-col items-center justify-center rounded-2xl border px-4 py-5 text-center ${currentTheme.border} ${sectionSurfaceClassName}`}
                    >
                      <RailCornersLevelFrame
                        level={level}
                        size={74}
                        isDarkMode={isDarkMode}
                        reserveShellSpace
                        levelMarkerVariant={markerVariant.key}
                      >
                        <AppAvatar
                          username={`${getSampleUsername(rowIndex)}-${markerVariant.key}`}
                          fullName={`${markerVariant.label}, level ${level}`}
                          size={74}
                          interactive={false}
                          enableBlink={false}
                          showInitial={false}
                        />
                      </RailCornersLevelFrame>
                      <p className={`font-ui-condensed mt-7 text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{markerVariant.label}</p>
                      <p className={`mt-1 text-xs font-semibold ${mutedTextClassName}`}>
                        Level <span className="font-due-date">{level}</span>
                      </p>
                    </article>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  function renderNorthStarMarkerSection() {
    return (
      <section className={`rounded-[2rem] border p-4 backdrop-blur-xl sm:p-5 ${panelClassName}`}>
        <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }}>
          <div>
            <p className={primaryEyebrowClassName}>Level marker grid</p>
            <h2 className={`font-ui-condensed mt-2 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              North Star, ten level displays
            </h2>
          </div>
          <p className={`max-w-xl text-sm leading-6 ${currentTheme.textSecondary}`}>
            Same marker candidates again, but with North Star fixed as the base ring so the marker/ring pairing is easier to judge.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div
            className="grid min-w-[112rem] gap-3"
            style={{ gridTemplateColumns: `minmax(8rem, 0.58fr) repeat(${LEVEL_MARKER_VARIANTS.length}, minmax(10.5rem, 1fr))` }}
          >
            <div className={`hidden rounded-2xl px-4 py-3 lg:block ${mutedEyebrowClassName}`}>
              Sample
            </div>
            {LEVEL_MARKER_VARIANTS.map((markerVariant) => (
              <div
                key={`north-star-heading-${markerVariant.key}`}
                className={`hidden rounded-2xl border px-4 py-3 lg:block ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-slate-50"}`}
              >
                <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{markerVariant.label}</p>
                <p className={`mt-1 text-xs leading-5 ${currentTheme.textMuted}`}>
                  {markerVariant.description}
                </p>
              </div>
            ))}

            {[5, 50, 150].map((level, rowIndex) => {
              const tier = getLevelTier(level);

              return (
                <div key={`north-star-marker-row-${level}`} className="contents">
                  <div className={`rounded-2xl border px-4 py-4 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/70"}`}>
                    <p className={mutedEyebrowClassName}>
                      {tier.name}
                    </p>
                    <p className={`mt-1 text-2xl font-semibold ${currentTheme.text}`}>
                      Level <span className="font-due-date">{level}</span>
                    </p>
                    <p className={`mt-1 text-xs font-semibold ${mutedTextClassName}`}>North Star base</p>
                  </div>

                  {LEVEL_MARKER_VARIANTS.map((markerVariant) => (
                    <article
                      key={`north-star-${markerVariant.key}-${level}`}
                      className={`flex min-h-52 flex-col items-center justify-center rounded-2xl border px-4 py-5 text-center ${currentTheme.border} ${sectionSurfaceClassName}`}
                    >
                      <NorthStarLevelFrame
                        level={level}
                        size={74}
                        isDarkMode={isDarkMode}
                        reserveShellSpace
                        levelMarkerVariant={markerVariant.key}
                      >
                        <AppAvatar
                          username={`${getSampleUsername(rowIndex)}-north-${markerVariant.key}`}
                          fullName={`North Star ${markerVariant.label}, level ${level}`}
                          size={74}
                          interactive={false}
                          enableBlink={false}
                          showInitial={false}
                        />
                      </NorthStarLevelFrame>
                      <p className={`font-ui-condensed mt-7 text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{markerVariant.label}</p>
                      <p className={`mt-1 text-xs font-semibold ${mutedTextClassName}`}>
                        Level <span className="font-due-date">{level}</span>
                      </p>
                    </article>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className={`min-h-screen px-5 py-8 ${pageBgClassName}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className={`rounded-[2rem] border p-6 backdrop-blur-xl sm:p-8 ${panelClassName}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className={primaryEyebrowClassName}>
                Level badge lab
              </p>
              <h1 className={`font-ui-condensed mt-3 text-3xl font-bold tracking-[0.01em] sm:text-5xl ${currentTheme.text}`}>
                Identicon level treatments
              </h1>
              <p className={`mt-4 max-w-2xl text-sm leading-6 sm:text-base ${currentTheme.textSecondary}`}>
                Static playground for choosing the actual production ring. The grid gives you ten shape options as
                separate columns before we lock the one that belongs on real avatars.
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

        {renderRingSection()}

        {renderLevelMarkerSection()}

        {renderNorthStarMarkerSection()}

        <section className={`rounded-[2rem] border p-5 ${panelClassName}`}>
          <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>Reading notes</p>
          <div className={`mt-3 grid gap-3 text-sm leading-6 md:grid-cols-3 ${currentTheme.textSecondary}`}>
            <p>Each row samples a different part of the 150-level color ladder, while each column changes only the ring geometry.</p>
            <p>The level marker stays fixed so the comparison is about ring shape, not typography or badge placement.</p>
            <p>The identicons use deterministic mock usernames, so ring changes can be compared without avatar drift.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
