import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Crown,
  Flame,
  Gauge,
  GitBranch,
  Layers3,
  ListChecks,
  Medal,
  MessageCircle,
  Palette,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRoundCheck,
  Zap,
} from "lucide-react";
import { BanBanLogo } from "../components/BanBanLogo";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";

type ThemeColors = ReturnType<typeof getThemeColors>;

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const navItems = [
  { label: "Progress", href: "#progress" },
  { label: "Workflow", href: "#workflow" },
  { label: "Planning poker", href: "#rituals" },
  { label: "Workspace", href: "#workspace" },
];

const mechanics = [
  { label: "XP", description: "Reward completed work.", icon: Zap },
  { label: "Levels", description: "Make momentum visible.", icon: Trophy },
  { label: "Milestones", description: "Mark meaningful progress.", icon: Medal },
  { label: "Leaderboard", description: "Keep team energy shared.", icon: Crown },
];

const workflowStages = [
  { label: "Staging", description: "Shape upcoming work before it becomes active.", icon: GitBranch },
  { label: "Planning poker", description: "Estimate together before moving into delivery.", icon: Gauge },
  { label: "Board", description: "Move active work through the Kanban flow.", icon: Layers3 },
  { label: "List", description: "Scan and filter work when density matters.", icon: ListChecks },
  { label: "History", description: "Review completed work and earned progress.", icon: BarChart3 },
];

const progressFeatures: FeatureItem[] = [
  {
    icon: Zap,
    title: "Progress without a separate game",
    description: "XP, levels, milestones, and leaderboard state sit on top of real Kanban habits instead of replacing them.",
  },
  {
    icon: Trophy,
    title: "Motivation that stays readable",
    description: "Gamification is visible enough to matter, but calm enough for daily project work.",
  },
  {
    icon: Crown,
    title: "Team recognition by board",
    description: "Leaderboards and levels make contribution visible in the same context where the work happens.",
  },
];

const ritualFeatures: FeatureItem[] = [
  {
    icon: Gauge,
    title: "Planning poker",
    description: "Estimate staged work in a live room, then bring the result back to the board.",
  },
  {
    icon: MessageCircle,
    title: "Shared task context",
    description: "Keep assignments, priorities, comments, labels, and points close to the work.",
  },
  {
    icon: ShieldCheck,
    title: "Board ownership",
    description: "Owners manage team access while members stay focused on delivery.",
  },
];

const workspaceFeatures: FeatureItem[] = [
  {
    icon: UserRoundCheck,
    title: "My Tasks",
    description: "A single place for assigned work across the boards a user belongs to.",
  },
  {
    icon: Palette,
    title: "Theme control",
    description: "Light, dark, and accent choices keep the workspace personal without breaking contrast.",
  },
  {
    icon: CheckCircle2,
    title: "Accessible by default",
    description: "The product direction keeps keyboard access, readable states, and clear actions in view.",
  },
];

function getGlassPanelClassName(currentTheme: ThemeColors, isDarkMode: boolean) {
  return isDarkMode
    ? `border-zinc-800/90 bg-zinc-950/74 shadow-[0_30px_90px_-62px_rgba(0,0,0,0.98)] ${currentTheme.text}`
    : `border-slate-200/90 bg-white/82 shadow-[0_30px_90px_-62px_rgba(15,23,42,0.38)] ${currentTheme.text}`;
}

function getQuietPanelClassName(currentTheme: ThemeColors, isDarkMode: boolean) {
  return isDarkMode
    ? `border-zinc-800/75 bg-zinc-950/46 ${currentTheme.text}`
    : `border-slate-200/80 bg-white/58 ${currentTheme.text}`;
}

function LandingButton({
  to,
  children,
  currentTheme,
  className = "",
  variant = "primary",
}: {
  to: string;
  children: ReactNode;
  currentTheme: ThemeColors;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";

  return (
    <Link
      to={to}
      className={[
        "group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-xl px-5 text-sm font-semibold transition-all duration-300 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0",
        currentTheme.focus,
        isPrimary
          ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-lg hover:scale-[1.03] hover:shadow-2xl`
          : `border ${currentTheme.border} ${currentTheme.text} bg-white/70 hover:scale-[1.02] hover:bg-white dark:bg-white/[0.04] dark:hover:bg-white/[0.07]`,
        className,
      ].join(" ")}
    >
      {isPrimary ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-white/20 blur-md transition-transform duration-700 group-hover:translate-x-[460%]"
        />
      ) : null}
      <span className="relative inline-flex items-center gap-2">
        {children}
        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  currentTheme,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description: string;
  currentTheme: ThemeColors;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className={`font-ui-condensed text-sm font-semibold uppercase tracking-[0.16em] ${currentTheme.primaryText}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-3 font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text} md:text-5xl`}>
        {title}
      </h2>
      <p className={`mt-4 text-base leading-7 ${currentTheme.textSecondary}`}>{description}</p>
    </div>
  );
}

function MechanicPill({
  label,
  description,
  icon: Icon,
  currentTheme,
  isDarkMode,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  currentTheme: ThemeColors;
  isDarkMode: boolean;
}) {
  return (
    <div className={`group rounded-2xl border px-4 py-3 transition-all duration-300 hover:-translate-y-1 ${getQuietPanelClassName(currentTheme, isDarkMode)}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${currentTheme.primarySoftStrong} ${currentTheme.primaryText}`}>
          <Icon aria-hidden="true" className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
        </span>
        <div className="min-w-0">
          <p className={`font-due-date text-sm font-semibold leading-none ${label === "XP" ? currentTheme.primaryText : currentTheme.text}`}>
            {label}
          </p>
          <p className={`mt-1 text-xs leading-5 ${currentTheme.textMuted}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}

function AbstractProgressVisual({
  currentTheme,
  isDarkMode,
}: {
  currentTheme: ThemeColors;
  isDarkMode: boolean;
}) {
  const surfaceClassName = getGlassPanelClassName(currentTheme, isDarkMode);
  const quietLineClassName = isDarkMode ? "bg-white/[0.08]" : "bg-slate-200";
  const nodeSurfaceClassName = isDarkMode ? "bg-zinc-950/88" : "bg-white/90";

  return (
    <div className="landing-float relative" aria-hidden="true">
      <div className={`absolute -left-10 top-8 h-48 w-48 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`} />
      <div className={`absolute -bottom-12 right-4 h-56 w-56 rounded-full bg-gradient-to-tr ${currentTheme.primarySoft} blur-3xl`} />

      <div className={`relative overflow-hidden rounded-[2.5rem] border p-6 backdrop-blur-xl ${surfaceClassName}`}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
          <div className={`absolute left-8 right-8 top-16 h-px ${quietLineClassName}`} />
          <div className={`absolute left-12 right-14 top-1/2 h-px ${quietLineClassName}`} />
          <div className={`absolute bottom-20 left-8 right-10 h-px ${quietLineClassName}`} />
          <div className={`absolute bottom-8 top-8 left-20 w-px ${quietLineClassName}`} />
          <div className={`absolute bottom-10 top-12 right-24 w-px ${quietLineClassName}`} />
        </div>

        <div className="relative grid min-h-[28rem] gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between gap-5">
            <div>
              <p className={`font-ui-condensed text-sm font-semibold uppercase tracking-[0.16em] ${currentTheme.primaryText}`}>
                Gamified Kanban
              </p>
              <p className={`mt-4 font-display-accent text-4xl font-bold leading-none ${currentTheme.text}`}>
                Work becomes progress.
              </p>
            </div>

            <div className="grid gap-3">
              {mechanics.map((item) => (
                <MechanicPill
                  key={item.label}
                  label={item.label}
                  description={item.description}
                  icon={item.icon}
                  currentTheme={currentTheme}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </div>

          <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem]">
            <div className={`absolute inset-x-8 top-1/2 h-1 -translate-y-1/2 rounded-full ${quietLineClassName}`} />
            <div className={`landing-flow-line absolute left-8 top-1/2 h-1 w-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r ${currentTheme.primary}`} />

            <div className="absolute left-[8%] top-[18%]">
              <AbstractNode label="Staging" icon={GitBranch} currentTheme={currentTheme} nodeSurfaceClassName={nodeSurfaceClassName} />
            </div>
            <div className="absolute right-[8%] top-[16%]">
              <AbstractNode label="Levels" icon={Trophy} currentTheme={currentTheme} nodeSurfaceClassName={nodeSurfaceClassName} />
            </div>
            <div className="absolute left-[31%] top-[45%]">
              <AbstractNode label="Poker" icon={Gauge} currentTheme={currentTheme} nodeSurfaceClassName={nodeSurfaceClassName} primary />
            </div>
            <div className="absolute right-[22%] bottom-[15%]">
              <AbstractNode label="History" icon={BarChart3} currentTheme={currentTheme} nodeSurfaceClassName={nodeSurfaceClassName} />
            </div>
            <div className="absolute bottom-[18%] left-[10%]">
              <AbstractNode label="Board" icon={Layers3} currentTheme={currentTheme} nodeSurfaceClassName={nodeSurfaceClassName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbstractNode({
  label,
  icon: Icon,
  currentTheme,
  nodeSurfaceClassName,
  primary = false,
}: {
  label: string;
  icon: LucideIcon;
  currentTheme: ThemeColors;
  nodeSurfaceClassName: string;
  primary?: boolean;
}) {
  return (
    <div className="landing-node group flex flex-col items-center gap-2">
      <span
        className={[
          "flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg transition-transform duration-300 group-hover:scale-105",
          primary ? `border-transparent bg-gradient-to-br ${currentTheme.primary} text-white` : `${currentTheme.border} ${nodeSurfaceClassName} ${currentTheme.primaryText}`,
        ].join(" ")}
      >
        <Icon aria-hidden="true" className="h-7 w-7" />
      </span>
      <span className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{label}</span>
    </div>
  );
}

function WorkflowLine({
  currentTheme,
  isDarkMode,
}: {
  currentTheme: ThemeColors;
  isDarkMode: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border p-5 ${getGlassPanelClassName(currentTheme, isDarkMode)}`}>
      <div className={`absolute left-8 right-8 top-[4.25rem] hidden h-px bg-gradient-to-r ${currentTheme.primarySoftStrong} lg:block`} aria-hidden="true" />
      <div className="relative grid gap-4 lg:grid-cols-5">
        {workflowStages.map((stage, index) => {
          const Icon = stage.icon;

          return (
            <article key={stage.label} className="relative">
              <div className={`h-full rounded-[1.5rem] border p-5 ${getQuietPanelClassName(currentTheme, isDarkMode)}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.primary} text-white`}>
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <span className={`font-due-date text-xs ${currentTheme.textMuted}`}>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className={`mt-5 font-ui-condensed text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                  {stage.label}
                </h3>
                <p className={`mt-3 text-sm leading-6 ${currentTheme.textMuted}`}>{stage.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function FeatureBand({
  eyebrow,
  title,
  description,
  features,
  currentTheme,
  isDarkMode,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  features: FeatureItem[];
  currentTheme: ThemeColors;
  isDarkMode: boolean;
  reverse?: boolean;
}) {
  return (
    <section className="px-5 py-24 sm:px-8">
      <div className={`mx-auto grid max-w-[1450px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          currentTheme={currentTheme}
          align="left"
        />

        <div className={`relative overflow-hidden rounded-[2rem] border p-5 ${getGlassPanelClassName(currentTheme, isDarkMode)}`}>
          <div className={`absolute -right-16 top-0 h-52 w-52 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} aria-hidden="true" />
          <div className="relative grid gap-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className={`group flex items-start gap-4 rounded-[1.35rem] border p-4 transition-all duration-300 hover:-translate-y-1 ${getQuietPanelClassName(currentTheme, isDarkMode)}`}>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.primarySoftStrong} ${currentTheme.primaryText}`}>
                    <Icon aria-hidden="true" className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
                  </span>
                  <div>
                    <h3 className={`font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                      {feature.title}
                    </h3>
                    <p className={`mt-1 text-sm leading-6 ${currentTheme.textMuted}`}>{feature.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Landing() {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const glassPanelClassName = getGlassPanelClassName(currentTheme, isDarkMode);

  return (
    <main className={`relative min-h-screen overflow-x-hidden ${currentTheme.bgSecondary}`}>
      <style>
        {`
          @media (prefers-reduced-motion: no-preference) {
            .landing-float { animation: landing-float 7s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate; }
            .landing-pulse { animation: landing-pulse 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
            .landing-flow-line { animation: landing-flow-line 3.2s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
            .landing-node { animation: landing-node 6s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate; }
            .landing-node:nth-child(2n) { animation-delay: 600ms; }
          }

          @keyframes landing-float {
            from { transform: translate3d(0, 0, 0); }
            to { transform: translate3d(0, -10px, 0); }
          }

          @keyframes landing-pulse {
            0%, 100% { transform: scale(1); opacity: 0.92; }
            50% { transform: scale(1.035); opacity: 1; }
          }

          @keyframes landing-flow-line {
            0% { transform: translateX(-52%) translateY(-50%); opacity: 0.18; }
            42% { opacity: 0.82; }
            100% { transform: translateX(120%) translateY(-50%); opacity: 0.08; }
          }

          @keyframes landing-node {
            from { transform: translate3d(0, 0, 0); }
            to { transform: translate3d(0, -6px, 0); }
          }
        `}
      </style>

      <div className={workspaceSurface.backgroundLayerClassName} aria-hidden="true">
        {workspaceSurface.backgroundBlobs.map((blob, index) => (
          <div key={index} className={blob.className} style={blob.style} />
        ))}
        <div className={`absolute left-0 top-20 h-[34rem] w-[34rem] rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`} />
        <div className={`absolute bottom-0 right-0 h-[32rem] w-[32rem] rounded-full bg-gradient-to-tr ${currentTheme.primarySoft} blur-3xl`} />
      </div>

      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-xl ${currentTheme.border}`}
        style={workspaceSurface.glassHeaderStyle}
      >
        <div className="mx-auto flex h-20 w-full max-w-[1850px] items-center justify-between gap-4 px-5 sm:px-8">
          <BanBanLogo size="lg" />

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Landing page sections">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.textSecondary} transition-colors hover:${currentTheme.text}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className={`hidden rounded-xl px-4 py-2 text-sm font-semibold ${currentTheme.textSecondary} transition-colors hover:${currentTheme.text} focus:outline-none focus:ring-2 focus:ring-offset-0 sm:inline-flex ${currentTheme.focus}`}
            >
              Log in
            </Link>
            <LandingButton to="/register" currentTheme={currentTheme} className="h-10 px-4">
              Get started
            </LandingButton>
          </div>
        </div>
      </header>

      <section className="relative z-10 px-5 pb-20 pt-16 sm:px-8 lg:pb-28 lg:pt-24">
        <div className="mx-auto grid max-w-[1850px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="max-w-3xl">
            <div className={`landing-pulse mb-7 inline-flex items-center gap-2 rounded-full border px-3 py-2 ${getQuietPanelClassName(currentTheme, isDarkMode)}`}>
              <Flame aria-hidden="true" className={`h-4 w-4 ${currentTheme.primaryText}`} />
              <span className={`font-ui-condensed text-sm font-semibold uppercase tracking-[0.14em] ${currentTheme.primaryText}`}>
                Gamified Kanban workspace
              </span>
            </div>

            <h1 className={`font-display-accent text-5xl font-bold leading-[0.95] tracking-[-0.03em] ${currentTheme.text} sm:text-6xl lg:text-7xl`}>
              Level up the work your team already does.
            </h1>
            <p className={`mt-6 max-w-2xl text-lg leading-8 ${currentTheme.textSecondary}`}>
              BanBan turns staging, planning poker, delivery, and history into visible progress with XP, levels, milestones, and leaderboard momentum.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LandingButton to="/register" currentTheme={currentTheme} className="h-14 px-7 text-base">
                Start leveling up
              </LandingButton>
              <LandingButton to="/login" currentTheme={currentTheme} variant="secondary" className="h-14 px-7 text-base">
                Log in
              </LandingButton>
            </div>
          </div>

          <AbstractProgressVisual currentTheme={currentTheme} isDarkMode={isDarkMode} />
        </div>
      </section>

      <section id="progress" className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-[1450px]">
          <SectionHeading
            eyebrow="Progress loop"
            title="Gamification that stays close to work."
            description="The visuals stay abstract and branded: progress paths, milestone nodes, and theme-accent motion around real BanBan concepts."
            currentTheme={currentTheme}
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {progressFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className={`group rounded-[1.75rem] border p-6 transition-all duration-300 hover:-translate-y-1 ${getQuietPanelClassName(currentTheme, isDarkMode)}`}>
                  <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.primary} text-white shadow-lg transition-transform duration-300 group-hover:rotate-3`}>
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <h3 className={`font-ui-condensed text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                    {feature.title}
                  </h3>
                  <p className={`mt-3 text-sm leading-6 ${currentTheme.textMuted}`}>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-[1450px]">
          <SectionHeading
            eyebrow="Workflow loop"
            title="Staging, estimation, delivery, history."
            description="A team can prepare work, estimate it together, move it through Board or List views, and review progress after completion."
            currentTheme={currentTheme}
          />

          <div className="mt-12">
            <WorkflowLine currentTheme={currentTheme} isDarkMode={isDarkMode} />
          </div>
        </div>
      </section>

      <FeatureBand
        eyebrow="Team rituals"
        title="Planning poker stays part of the Kanban flow."
        description="BanBan supports the recurring moments teams already have: estimating upcoming work, aligning on context, and keeping board access clear."
        features={ritualFeatures}
        currentTheme={currentTheme}
        isDarkMode={isDarkMode}
      />

      <FeatureBand
        eyebrow="Personal workspace"
        title="Every teammate can find their own work."
        description="My Tasks, profile progress, filters, and theme preferences keep the system useful for individuals, not just board owners."
        features={workspaceFeatures}
        currentTheme={currentTheme}
        isDarkMode={isDarkMode}
        reverse
      />

      <section className="px-5 py-24 sm:px-8">
        <div className={`relative mx-auto max-w-[1450px] overflow-hidden rounded-[2.25rem] border p-8 text-center backdrop-blur-xl md:p-12 ${glassPanelClassName}`}>
          <div className={`absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`} aria-hidden="true" />
          <div className="relative mx-auto max-w-3xl">
            <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${currentTheme.primary} text-white shadow-xl`}>
              <Sparkles aria-hidden="true" className="h-8 w-8" />
            </div>
            <p className={`font-display-accent text-4xl font-bold leading-tight ${currentTheme.text} md:text-5xl`}>
              Make progress visible.
            </p>
            <p className={`mx-auto mt-5 max-w-2xl text-base leading-7 ${currentTheme.textSecondary}`}>
              Start with a board, stage the next work, estimate as a team, and let completed work become momentum.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LandingButton to="/register" currentTheme={currentTheme} className="h-14 px-7 text-base">
                Create your account
              </LandingButton>
              <Link
                to="/login"
                className={`inline-flex h-14 items-center justify-center rounded-xl px-7 text-base font-semibold ${currentTheme.textSecondary} transition-colors hover:${currentTheme.text} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`}
              >
                I already have one
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={`relative z-10 border-t px-5 py-8 ${currentTheme.border} sm:px-8`}>
        <div className="mx-auto flex max-w-[1850px] flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <BanBanLogo size="md" />
          <p className={`text-sm ${currentTheme.textMuted}`}>
            Copyright 2026 BanBan. Gamified Kanban for teams that like visible progress.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className={`text-sm font-semibold ${currentTheme.textSecondary} hover:${currentTheme.text}`}>
              Log in
            </Link>
            <Link to="/register" className={`text-sm font-semibold ${currentTheme.primaryText} hover:underline`}>
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
