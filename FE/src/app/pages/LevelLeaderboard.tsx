import { useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";
import { Link } from "react-router";
import { BarChart3, CalendarRange, LoaderCircle, PanelsTopLeft } from "lucide-react";
import { LevelLeaderboardPreview } from "../components/LevelLeaderboardPreview";
import {
  LEADERBOARD_PERIOD_LABELS,
  LEADERBOARD_PERIODS,
  LEVEL_LEADERBOARD_VARIANTS,
  type LeaderboardPeriod,
  type LevelLeaderboardBoard,
} from "../utils/levelLeaderboard";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { getPanelEyebrowClassName } from "../components/typographyStyles";

const SAMPLE_BOARDS: LevelLeaderboardBoard[] = [
  {
    id: 1,
    name: "Atlas Launch",
    description: "Release work, bug burn-down, and planning poker follow-through.",
    logoIconKey: "rocket",
    logoColorKey: "blue",
    currentUserId: 104,
    members: [
      { userId: 101, username: "mako-rivers", displayName: "Mako Rivers", level: 42, xpByPeriod: { day: 80, week: 420, month: 1580, year: 12460 } },
      { userId: 102, username: "juniper-vale", displayName: "Juniper Vale", level: 36, xpByPeriod: { day: 120, week: 380, month: 1460, year: 11340 } },
      { userId: 103, username: "orbit-hale", displayName: "Orbit Hale", level: 51, xpByPeriod: { day: 20, week: 360, month: 1320, year: 14120 } },
      { userId: 104, username: "vesper-quinn", displayName: "Vesper Quinn", level: 29, xpByPeriod: { day: 60, week: 255, month: 1100, year: 9820 } },
      { userId: 105, username: "copper-mint", displayName: "Copper Mint", level: 23, xpByPeriod: { day: 30, week: 190, month: 940, year: 7320 } },
    ],
  },
  {
    id: 2,
    name: "Signal Garden",
    description: "Research-heavy board with tidy weekly XP bursts.",
    logoIconKey: "palette",
    logoColorKey: "emerald",
    currentUserId: 203,
    members: [
      { userId: 201, username: "solar-ash", displayName: "Solar Ash", level: 64, xpByPeriod: { day: 45, week: 310, month: 1840, year: 18900 } },
      { userId: 202, username: "myth-lane", displayName: "Myth Lane", level: 58, xpByPeriod: { day: 70, week: 290, month: 1680, year: 17220 } },
      { userId: 203, username: "nova-sable", displayName: "Nova Sable", level: 61, xpByPeriod: { day: 110, week: 540, month: 1760, year: 18110 } },
      { userId: 204, username: "kestrel-fox", displayName: "Kestrel Fox", level: 40, xpByPeriod: { day: 15, week: 220, month: 1240, year: 10020 } },
      { userId: 205, username: "rio-stone", displayName: "Rio Stone", level: 37, xpByPeriod: { day: 55, week: 205, month: 1110, year: 9640 } },
    ],
  },
  {
    id: 3,
    name: "Northstar Ops",
    description: "Operational kanban board for focused delivery rituals.",
    logoIconKey: "chartNoAxesColumn",
    logoColorKey: "violet",
    currentUserId: 304,
    members: [
      { userId: 301, username: "lumen-pike", displayName: "Lumen Pike", level: 73, xpByPeriod: { day: 150, week: 690, month: 2480, year: 20580 } },
      { userId: 302, username: "iris-cove", displayName: "Iris Cove", level: 68, xpByPeriod: { day: 90, week: 610, month: 2260, year: 19820 } },
      { userId: 303, username: "mira-quill", displayName: "Mira Quill", level: 59, xpByPeriod: { day: 85, week: 460, month: 2090, year: 17600 } },
      { userId: 304, username: "cobalt-reed", displayName: "Cobalt Reed", level: 57, xpByPeriod: { day: 40, week: 330, month: 1900, year: 16840 } },
      { userId: 305, username: "ember-wolf", displayName: "Ember Wolf", level: 44, xpByPeriod: { day: 25, week: 280, month: 1440, year: 12020 } },
    ],
  },
];

type LeaderboardGridRow =
  | { kind: "board"; board: LevelLeaderboardBoard }
  | { kind: "state"; id: "loading" | "error"; title: string; description: string; board: LevelLeaderboardBoard };

const LEADERBOARD_GRID_ROWS: LeaderboardGridRow[] = [
  ...SAMPLE_BOARDS.map((board) => ({ kind: "board" as const, board })),
  {
    kind: "state",
    id: "loading",
    title: "Loading state",
    description: "Preview the widget before the board XP rankings resolve.",
    board: SAMPLE_BOARDS[0],
  },
  {
    kind: "state",
    id: "error",
    title: "Error state",
    description: "Preview the fallback when leaderboard data cannot be loaded.",
    board: SAMPLE_BOARDS[1],
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function getBoardTopXp(board: LevelLeaderboardBoard, period: LeaderboardPeriod) {
  return Math.max(...board.members.map((member) => member.xpByPeriod[period]));
}

function getCurrentUserRank(board: LevelLeaderboardBoard, period: LeaderboardPeriod) {
  return [...board.members]
    .sort((left, right) => {
      const xpDifference = right.xpByPeriod[period] - left.xpByPeriod[period];
      if (xpDifference !== 0) {
        return xpDifference;
      }

      const levelDifference = right.level - left.level;
      if (levelDifference !== 0) {
        return levelDifference;
      }

      return left.displayName.localeCompare(right.displayName);
    })
    .findIndex((member) => member.userId === board.currentUserId) + 1;
}

export function LevelLeaderboard() {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const mutedEyebrowClassName = getPanelEyebrowClassName(currentTheme.textMuted);
  const primaryEyebrowClassName = getPanelEyebrowClassName(currentTheme.primaryText);
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const expandedScrollerRef = useRef<HTMLDivElement>(null);
  const collapsedScrollerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });

  const pageBgClassName = isDarkMode
    ? "bg-[radial-gradient(circle_at_top_left,rgba(39,39,42,0.92),#09090b_42%,#050505_100%)]"
    : "bg-[radial-gradient(circle_at_top_left,rgba(248,250,252,1),#eef2f7_44%,#e2e8f0_100%)]";
  const panelClassName = `${isDarkMode ? "border-zinc-800 bg-zinc-950/72" : "border-slate-200 bg-white/82"} shadow-[0_24px_90px_-56px_rgba(15,23,42,0.55)]`;
  const sectionSurfaceClassName = isDarkMode ? "bg-zinc-900/42" : "bg-white/72";
  const scrollbarClassName = isDarkMode
    ? "[scrollbar-color:rgba(113,113,122,0.92)_rgba(24,24,27,0.85)] [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-track]:bg-zinc-900/80"
    : "[scrollbar-color:rgba(100,116,139,0.86)_rgba(226,232,240,0.92)] [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-slate-200/90";
  const topXpAcrossBoards = SAMPLE_BOARDS.reduce(
    (highest, board) => Math.max(highest, getBoardTopXp(board, period)),
    0,
  );

  const handleGridPointerDown = (
    event: PointerEvent<HTMLDivElement>,
    scrollerRef: RefObject<HTMLDivElement>,
  ) => {
    const target = event.target instanceof Element ? event.target : null;

    if (
      event.button !== 0 ||
      !scrollerRef.current ||
      target?.closest("button, a, input, select, textarea, [role='button'], [role='tab']")
    ) {
      return;
    }

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: scrollerRef.current.scrollLeft,
    };
    scrollerRef.current.setPointerCapture(event.pointerId);
  };

  const handleGridPointerMove = (
    event: PointerEvent<HTMLDivElement>,
    scrollerRef: RefObject<HTMLDivElement>,
  ) => {
    if (!dragStateRef.current.isDragging || !scrollerRef.current) {
      return;
    }

    event.preventDefault();
    const distance = event.clientX - dragStateRef.current.startX;
    scrollerRef.current.scrollLeft = dragStateRef.current.scrollLeft - distance;
  };

  const stopGridDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragStateRef.current.isDragging = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  function renderVariantGrid(
    density: "expanded" | "collapsed",
    scrollerRef: RefObject<HTMLDivElement>,
  ) {
    const isExpandedGrid = density === "expanded";
    const columnWidth = isExpandedGrid ? 19.5 : 8.75;

    return (
      <div
        ref={scrollerRef}
        className={`mt-4 cursor-grab overflow-x-auto overscroll-x-contain pb-5 active:cursor-grabbing [scrollbar-width:thin] [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full ${scrollbarClassName}`}
        onPointerDown={(event) => handleGridPointerDown(event, scrollerRef)}
        onPointerMove={(event) => handleGridPointerMove(event, scrollerRef)}
        onPointerUp={stopGridDrag}
        onPointerCancel={stopGridDrag}
        onPointerLeave={stopGridDrag}
      >
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `minmax(12rem, 0.64fr) repeat(${LEVEL_LEADERBOARD_VARIANTS.length}, minmax(${columnWidth}rem, 1fr))`,
            minWidth: `${14 + LEVEL_LEADERBOARD_VARIANTS.length * (columnWidth + 0.75)}rem`,
          }}
        >
          <div className={`hidden rounded-2xl px-4 py-3 lg:block ${mutedEyebrowClassName}`}>
            Board sample
          </div>

          {LEVEL_LEADERBOARD_VARIANTS.map((variant) => (
            <div
              key={`${density}-heading-${variant.key}`}
              className={`hidden rounded-2xl border px-4 py-3 lg:block ${currentTheme.border} ${sectionSurfaceClassName}`}
            >
              <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{variant.label}</p>
              <p className={`mt-1 text-xs leading-5 ${currentTheme.textMuted}`}>{variant.description}</p>
            </div>
          ))}

          {LEADERBOARD_GRID_ROWS.map((row) => {
            const board = row.board;
            const rowKey = row.kind === "board" ? `board-${board.id}` : `state-${row.id}`;
            const previewState = row.kind === "state" ? row.id : "ready";
            const isStateRow = row.kind === "state";

            return (
              <div key={`${density}-row-${rowKey}`} className="contents">
                <div className={`rounded-2xl border px-4 py-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
                  {isStateRow ? (
                    <>
                      <div className="flex items-center gap-2">
                        {row.id === "loading" ? (
                          <LoaderCircle className={`h-4 w-4 animate-spin ${currentTheme.primaryText}`} aria-hidden="true" />
                        ) : (
                          <span className={`font-due-date text-xs font-semibold ${isDarkMode ? "text-red-400" : "text-red-500"}`}>N/A</span>
                        )}
                        <p className={primaryEyebrowClassName}>{row.title}</p>
                      </div>
                      <p className={`mt-2 text-sm leading-5 ${currentTheme.textSecondary}`}>{row.description}</p>
                      <div className={`font-due-date mt-4 rounded-xl border px-3 py-2 text-xs font-semibold ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-white/70"} ${currentTheme.textMuted}`}>
                        Uses {board.name} sample data shape
                      </div>
                    </>
                  ) : (
                    <>
                      <p className={primaryEyebrowClassName}>
                        {board.name}
                      </p>
                      <p className={`mt-2 text-sm leading-5 ${currentTheme.textSecondary}`}>{board.description}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className={`rounded-xl border px-3 py-2 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-white/70"}`}>
                          <p className={mutedEyebrowClassName}>Top XP</p>
                          <p className={`font-due-date mt-1 text-sm font-semibold ${currentTheme.text}`}>{formatNumber(getBoardTopXp(board, period))}</p>
                        </div>
                        <div className={`rounded-xl border px-3 py-2 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-white/70"}`}>
                          <p className={mutedEyebrowClassName}>You</p>
                          <p className={`font-due-date mt-1 text-sm font-semibold ${currentTheme.text}`}>#{getCurrentUserRank(board, period)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {LEVEL_LEADERBOARD_VARIANTS.map((variant) => (
                  <div
                    key={`${density}-${rowKey}-${variant.key}`}
                    className={`flex ${isExpandedGrid ? "items-start" : "items-stretch"} justify-center`}
                  >
                    <LevelLeaderboardPreview
                      board={board}
                      period={period}
                      onPeriodChange={setPeriod}
                      variant={variant.key}
                      density={density}
                      previewState={previewState}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <main className={`min-h-screen ${pageBgClassName} px-4 py-8 sm:px-6 lg:px-8`}>
      <div className="mx-auto flex max-w-[1900px] flex-col gap-6">
        <header className={`relative overflow-hidden rounded-[2rem] border p-6 backdrop-blur-xl sm:p-8 ${panelClassName}`}>
          <div className={`pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} />
          <div className={`pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-gradient-to-tr ${currentTheme.primarySoftStrong} blur-3xl`} />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                to="/levelprogress"
                className={`${primaryEyebrowClassName} hover:underline`}
              >
                XP card lab
              </Link>
              <h1 className={`font-ui-condensed mt-3 text-4xl font-bold tracking-[0.01em] sm:text-5xl ${currentTheme.text}`}>
                Sidebar level leaderboard
              </h1>
              <p className={`mt-3 max-w-3xl text-sm leading-6 sm:text-base ${currentTheme.textSecondary}`}>
                Fresh leaderboard directions for a per-board XP widget. Rows stress-test different board samples; columns compare the actual visual concepts side by side.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className={`rounded-2xl border px-4 py-3 text-sm ${currentTheme.border} ${sectionSurfaceClassName} ${currentTheme.textSecondary}`}>
                Public route: <span className={`font-due-date font-semibold ${currentTheme.text}`}>/levelleaderboard</span>
              </div>
              <div className={`rounded-2xl border px-4 py-3 text-sm ${currentTheme.border} ${sectionSurfaceClassName} ${currentTheme.textSecondary}`}>
                Variants: <span className={`font-due-date font-semibold ${currentTheme.text}`}>{LEVEL_LEADERBOARD_VARIANTS.length}</span>
              </div>
            </div>
          </div>
        </header>

        <section className={`rounded-[2rem] border p-5 backdrop-blur-xl ${panelClassName}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className={primaryEyebrowClassName}>Time window</p>
              <h2 className={`font-ui-condensed mt-2 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                Rank by selected-window XP
              </h2>
              <p className={`mt-2 max-w-2xl text-sm leading-6 ${currentTheme.textSecondary}`}>
                Switch the period once and every direction updates together. Default remains week.
              </p>
            </div>
            <div className={`grid w-full gap-1 rounded-2xl border p-1 sm:w-auto sm:grid-cols-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
              {LEADERBOARD_PERIODS.map((periodOption) => (
                <button
                  key={periodOption}
                  type="button"
                  onClick={() => setPeriod(periodOption)}
                  className={`font-ui-condensed rounded-xl px-4 py-2 text-sm font-semibold tracking-[0.01em] transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${
                    periodOption === period
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-sm`
                      : `${currentTheme.textMuted} ${isDarkMode ? "hover:bg-white/[0.06]" : "hover:bg-slate-900/[0.045]"}`
                  }`}
                  aria-pressed={periodOption === period}
                >
                  {LEADERBOARD_PERIOD_LABELS[periodOption]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={`rounded-[2rem] border p-4 backdrop-blur-xl sm:p-5 ${panelClassName}`}>
          <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }}>
            <div>
              <p className={primaryEyebrowClassName}>Variant grid</p>
              <h2 className={`font-ui-condensed mt-2 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                Expanded sidebar directions
              </h2>
            </div>
            <p className={`max-w-xl text-sm leading-6 ${currentTheme.textSecondary}`}>
              Drag horizontally, use a trackpad, or grab the scrollbar. This is the same comparison-grid logic as the level labs.
            </p>
          </div>
          {renderVariantGrid("expanded", expandedScrollerRef)}
        </section>

        <section className={`rounded-[2rem] border p-4 backdrop-blur-xl sm:p-5 ${panelClassName}`}>
          <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }}>
            <div>
              <p className={primaryEyebrowClassName}>Rail grid</p>
              <h2 className={`font-ui-condensed mt-2 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                Collapsed sidebar variants
              </h2>
            </div>
            <p className={`max-w-xl text-sm leading-6 ${currentTheme.textSecondary}`}>
              Same concepts, squeezed into the icon rail. Tooltips carry the detail that cannot fit inside the collapsed sidebar.
            </p>
          </div>
          {renderVariantGrid("collapsed", collapsedScrollerRef)}
        </section>

        <section className={`rounded-[2rem] border p-5 ${panelClassName}`}>
          <div className="grid gap-3 md:grid-cols-3">
            <div className={`rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
              <BarChart3 className={`h-5 w-5 ${currentTheme.primaryText}`} aria-hidden="true" />
              <p className={`font-ui-condensed mt-3 text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>Ranking rule</p>
              <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>
                Rank by XP in the selected period, then level, then display name.
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
              <PanelsTopLeft className={`h-5 w-5 ${currentTheme.primaryText}`} aria-hidden="true" />
              <p className={`font-ui-condensed mt-3 text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>Grid shape</p>
              <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>
                The page compares <span className={`font-due-date font-semibold ${currentTheme.text}`}>{LEVEL_LEADERBOARD_VARIANTS.length}</span> concepts across <span className={`font-due-date font-semibold ${currentTheme.text}`}>{SAMPLE_BOARDS.length}</span> board samples.
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
              <CalendarRange className={`h-5 w-5 ${currentTheme.primaryText}`} aria-hidden="true" />
              <p className={`font-ui-condensed mt-3 text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>Current sample</p>
              <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>
                Active window is <span className={`font-due-date font-semibold ${currentTheme.text}`}>{LEADERBOARD_PERIOD_LABELS[period]}</span>; highest sample score is <span className={`font-due-date font-semibold ${currentTheme.text}`}>{formatNumber(topXpAcrossBoards)} XP</span>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
