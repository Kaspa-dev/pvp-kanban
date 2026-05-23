import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Columns3,
  Crown,
  Flame,
  Gauge,
  GitBranch,
  ListChecks,
  Medal,
  MessageCircle,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { AppAvatar } from '../components/AppAvatar';
import { BanBanLogo } from '../components/BanBanLogo';
import { LevelLeaderboardPreview } from '../components/LevelLeaderboardPreview';
import { LevelProgressCard } from '../components/LevelProgressCard';
import { PlanningPokerVoteDeck } from '../components/planning-poker/PlanningPokerVoteDeck';
import { PriorityAccent } from '../components/PriorityAccent';
import { StagingTaskActionButton } from '../components/StagingTaskActionButton';
import { TaskDueDateBadge } from '../components/TaskDueDateBadge';
import { TaskLabelSummary } from '../components/TaskLabelSummary';
import { WorkspaceSummaryBand } from '../components/WorkspaceSummaryBand';
import { getThemeColors, useTheme } from '../contexts/ThemeContext';
import type { Priority, TaskAssignee, TaskType } from '../utils/cards';
import type { GamificationSummary } from '../utils/gamification';
import type { Label } from '../utils/labels';
import type { LevelLeaderboardBoard } from '../utils/levelLeaderboard';
import { getWorkspaceSurfaceStyles } from '../utils/workspaceSurfaceStyles';

type ThemeColors = ReturnType<typeof getThemeColors>;

interface FeatureItem {
  icon: LucideIcon;
  label: string;
  description: string;
}

interface PreviewTask {
  id: number;
  title: string;
  labelIds: number[];
  assignee: TaskAssignee;
  storyPoints?: number;
  dueDate?: string | null;
  priority?: Priority;
  taskType?: TaskType;
}

const landingLabels: Label[] = [
  { id: 1, name: 'UX', color: '#0ea5e9' },
  { id: 2, name: 'Polish', color: '#8b5cf6' },
  { id: 3, name: 'Poker', color: '#10b981' },
  { id: 4, name: 'Auth', color: '#f97316' },
];

const landingAssignees: TaskAssignee[] = [
  {
    userId: 1,
    username: 'mara-flow',
    displayName: 'Mara Flow',
    name: 'Mara Flow',
    email: 'mara@example.com',
    color: '#0ea5e9',
    role: 'member',
    currentLevel: 18,
  },
  {
    userId: 2,
    username: 'iris-cove',
    displayName: 'Iris Cove',
    name: 'Iris Cove',
    email: 'iris@example.com',
    color: '#8b5cf6',
    role: 'member',
    currentLevel: 16,
  },
  {
    userId: 3,
    username: 'you',
    displayName: 'You',
    name: 'You',
    email: 'you@example.com',
    color: '#f43f5e',
    role: 'owner',
    currentLevel: 14,
  },
];

const previewTasks: PreviewTask[] = [
  {
    id: 1,
    title: 'Tune profile progress popover',
    labelIds: [1, 2],
    assignee: landingAssignees[2],
    storyPoints: 5,
    dueDate: '2026-06-12',
    priority: 'high',
    taskType: 'task',
  },
  {
    id: 2,
    title: 'Estimate onboarding flow',
    labelIds: [3, 4],
    assignee: landingAssignees[0],
    storyPoints: 8,
    dueDate: '2026-06-18',
    priority: 'medium',
    taskType: 'story',
  },
  {
    id: 3,
    title: 'Ship level badge rewards',
    labelIds: [2],
    assignee: landingAssignees[1],
    storyPoints: 3,
    dueDate: '2026-06-20',
    priority: 'low',
    taskType: 'task',
  },
];

const sampleSummary: GamificationSummary = {
  lifetimeXp: 6420,
  currentLevel: 18,
  currentLevelName: 'Signal Runner',
  currentLevelXp: 740,
  xpForNextLevel: 1000,
  xpRemainingForNextLevel: 260,
  progressPercent: 74,
  weeklyXp: 840,
  monthlyXp: 2360,
  tasksCompleted: 128,
  prestige: 0,
};

const sampleLeaderboard: LevelLeaderboardBoard = {
  id: 1,
  name: 'Product Launch',
  description: 'Team progress by board',
  logoIconKey: 'rocket',
  logoColorKey: 'blue',
  currentUserId: 3,
  members: [
    {
      userId: 1,
      username: 'mara-flow',
      displayName: 'Mara Flow',
      level: 18,
      xpByPeriod: { day: 180, week: 2430, month: 7420, year: 42100 },
    },
    {
      userId: 2,
      username: 'iris-cove',
      displayName: 'Iris Cove',
      level: 16,
      xpByPeriod: { day: 150, week: 2060, month: 7010, year: 39880 },
    },
    {
      userId: 3,
      username: 'you',
      displayName: 'You',
      level: 14,
      xpByPeriod: { day: 140, week: 1990, month: 6640, year: 35120 },
    },
    {
      userId: 4,
      username: 'jonas-loop',
      displayName: 'Jonas Loop',
      level: 12,
      xpByPeriod: { day: 90, week: 1310, month: 5420, year: 24100 },
    },
  ],
};

const progressFeatures: FeatureItem[] = [
  {
    icon: Trophy,
    label: 'XP where work happens',
    description: 'Progress is visible in cards, history, profile surfaces, and board sidebars.',
  },
  {
    icon: Crown,
    label: 'Levels with identity',
    description: 'Profiles and avatars carry level state without replacing the person behind the work.',
  },
  {
    icon: Medal,
    label: 'Milestones with proof',
    description: 'Achievements tie back to actual task completion, comments, planning, and delivery.',
  },
];

const workflowSteps = [
  { label: 'Staging', icon: GitBranch, description: 'Collect upcoming tasks before they enter active board flow.' },
  { label: 'Planning poker', icon: Gauge, description: 'Estimate staged work with the team in a live room.' },
  { label: 'Board/List', icon: Columns3, description: 'Move delivery work through the workspace views.' },
  { label: 'History', icon: BarChart3, description: 'Review completed work, points, and XP after delivery.' },
];

const teamFeatures: FeatureItem[] = [
  {
    icon: Users,
    label: 'Team access',
    description: 'Board owners control access while members work in shared context.',
  },
  {
    icon: MessageCircle,
    label: 'Task context',
    description: 'Labels, assignees, due dates, comments, and points stay close to the task.',
  },
  {
    icon: ListChecks,
    label: 'Queue to To Do',
    description: 'Stage work first, then launch a ready batch into the board.',
  },
];

const personalFeatures = [
  'My Tasks for assigned work',
  'Filters for labels, people, due dates, and status',
  'Theme accents in light and dark mode',
  'Profile progress, levels, and milestones',
];

function getGlassPanelClassName(currentTheme: ThemeColors, isDarkMode: boolean) {
  return isDarkMode
    ? `border-zinc-800/90 bg-zinc-950/78 shadow-[0_32px_90px_-64px_rgba(0,0,0,0.95)] ${currentTheme.text}`
    : `border-slate-200/90 bg-white/86 shadow-[0_32px_90px_-64px_rgba(15,23,42,0.38)] ${currentTheme.text}`;
}

function getMutedPanelClassName(currentTheme: ThemeColors, isDarkMode: boolean) {
  return isDarkMode
    ? `border-zinc-800/75 bg-zinc-950/48 ${currentTheme.text}`
    : `border-slate-200/80 bg-white/62 ${currentTheme.text}`;
}

function ShineButton({
  to,
  children,
  currentTheme,
  className = '',
  variant = 'primary',
}: {
  to: string;
  children: ReactNode;
  currentTheme: ThemeColors;
  className?: string;
  variant?: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';

  return (
    <Link
      to={to}
      className={[
        'group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-xl px-5 text-sm font-semibold transition-all duration-300 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0',
        currentTheme.focus,
        isPrimary
          ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-lg hover:scale-[1.03] hover:shadow-2xl`
          : `border ${currentTheme.border} ${currentTheme.text} bg-white/70 hover:scale-[1.02] hover:bg-white dark:bg-white/[0.04] dark:hover:bg-white/[0.07]`,
        className,
      ].join(' ')}
    >
      {isPrimary ? (
        <span
          className="pointer-events-none absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-white/20 blur-md transition-transform duration-700 group-hover:translate-x-[460%]"
          aria-hidden="true"
        />
      ) : null}
      <span className="relative inline-flex items-center gap-2">
        {children}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  currentTheme,
}: {
  eyebrow: string;
  title: string;
  description: string;
  currentTheme: ThemeColors;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
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

function getTaskTypeLabel(taskType?: TaskType) {
  switch (taskType) {
    case 'bug':
      return 'Bug';
    case 'spike':
      return 'Spike';
    case 'story':
      return 'Story';
    case 'task':
      return 'Task';
    default:
      return null;
  }
}

function StaticTaskCard({
  task,
  currentTheme,
  isDarkMode,
  footerAction,
}: {
  task: PreviewTask;
  currentTheme: ThemeColors;
  isDarkMode: boolean;
  footerAction?: ReactNode;
}) {
  const labels = task.labelIds
    .map((labelId) => landingLabels.find((label) => label.id === labelId))
    .filter((label): label is Label => Boolean(label));
  const taskTypeLabel = getTaskTypeLabel(task.taskType);
  const taskSurfaceClassName = isDarkMode ? 'bg-zinc-900/90' : 'bg-white/95';

  return (
    <article className={`relative overflow-hidden rounded-lg border-2 ${currentTheme.border} ${taskSurfaceClassName} shadow-none`}>
      {task.priority ? <PriorityAccent priority={task.priority} isDarkMode={isDarkMode} /> : null}
      <div className="px-4 py-4 pl-7">
        <div className="relative min-w-0">
          {task.storyPoints ? (
            <div className={`absolute right-0 top-0 flex items-center gap-1 font-medium ${currentTheme.textMuted}`}>
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span className="font-due-date text-sm">{task.storyPoints}</span>
            </div>
          ) : null}

          <div className={`mb-2 flex min-w-0 items-center gap-2 overflow-hidden ${task.storyPoints ? 'pr-14' : ''} ${currentTheme.textMuted}`}>
            {taskTypeLabel ? <span className="font-due-date shrink-0 text-xs font-medium">{taskTypeLabel}</span> : null}
            <TaskLabelSummary labels={labels} maxVisible={2} compactMaxVisible={1} collapseToFit />
          </div>

          <h3 className={`line-clamp-2 text-sm font-semibold leading-snug ${task.storyPoints ? 'pr-14' : ''} ${currentTheme.text}`}>
            {task.title}
          </h3>

          <div className="mt-4 flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              {task.dueDate ? <TaskDueDateBadge dueDate={task.dueDate} /> : null}
            </div>
            <AppAvatar
              username={task.assignee.username}
              fullName={task.assignee.displayName}
              level={task.assignee.currentLevel}
              size={32}
              interactive={false}
              enableBlink={false}
            />
          </div>

          {footerAction ? <div className="mt-4 flex justify-end">{footerAction}</div> : null}
        </div>
      </div>
    </article>
  );
}

function StaticBoardPreview({
  currentTheme,
  isDarkMode,
}: {
  currentTheme: ThemeColors;
  isDarkMode: boolean;
}) {
  const columnSurfaceClassName = isDarkMode ? 'bg-zinc-950/52' : 'bg-slate-50/88';
  const columnHeaderSurfaceClassName = isDarkMode ? 'bg-zinc-900/46' : 'bg-white/78';
  const boardColumns = [
    { title: 'To Do', count: 1, cards: [previewTasks[1]] },
    { title: 'In Review', count: 1, cards: [previewTasks[2]] },
  ];

  return (
    <div className={`rounded-[2rem] border p-4 ${getGlassPanelClassName(currentTheme, isDarkMode)}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={`font-ui-condensed text-xs font-semibold uppercase tracking-[0.16em] ${currentTheme.primaryText}`}>
            Product Launch
          </p>
          <h3 className={`font-ui-condensed text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
            Staging to board
          </h3>
        </div>
        <div className={`flex rounded-2xl border p-1 ${currentTheme.border} ${isDarkMode ? 'bg-black/22' : 'bg-white/78'}`}>
          {['Board', 'List', 'Staging', 'History'].map((tab) => (
            <span
              key={tab}
              className={`font-ui-condensed rounded-xl px-3 py-1.5 text-xs font-semibold tracking-[0.01em] ${
                tab === 'Staging'
                  ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-sm`
                  : currentTheme.textMuted
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className={`min-h-0 overflow-hidden rounded-2xl border ${currentTheme.border} ${columnSurfaceClassName}`}>
          <div className={`border-b px-4 py-3 ${currentTheme.border} ${columnHeaderSurfaceClassName}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className={`font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>Staging Tasks</h4>
                <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>Upcoming work ready to estimate or queue.</p>
              </div>
              <span className={`font-due-date text-xs ${currentTheme.textMuted}`}>2 tasks</span>
            </div>
          </div>
          <div className="space-y-3 p-3">
            {[previewTasks[0], previewTasks[1]].map((task, index) => (
              <StaticTaskCard
                key={task.id}
                task={task}
                currentTheme={currentTheme}
                isDarkMode={isDarkMode}
                footerAction={
                  index === 0 ? (
                    <StagingTaskActionButton tabIndex={-1}>Add to Queue</StagingTaskActionButton>
                  ) : undefined
                }
              />
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {boardColumns.map((column) => (
          <section key={column.title} className={`min-h-0 overflow-hidden rounded-2xl border ${currentTheme.border} ${columnSurfaceClassName}`}>
            <div className={`border-b px-4 py-3 ${currentTheme.border} ${columnHeaderSurfaceClassName}`}>
              <div className="flex items-center justify-between gap-3">
                <h4 className={`font-kanban-column-title text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>{column.title}</h4>
                <span className={`font-due-date text-xs ${currentTheme.textMuted}`}>{column.count}</span>
              </div>
              <div className={`mt-3 grid h-1.5 grid-cols-5 gap-1 rounded-full`}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className={`rounded-full ${index < column.count ? `bg-gradient-to-r ${currentTheme.primary}` : isDarkMode ? 'bg-white/[0.07]' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3 p-3">
              {column.cards.map((task) => (
                <StaticTaskCard
                  key={task.id}
                  task={task}
                  currentTheme={currentTheme}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroWorkspacePreview({
  currentTheme,
  isDarkMode,
}: {
  currentTheme: ThemeColors;
  isDarkMode: boolean;
}) {
  return (
    <div className="landing-float relative mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]" aria-hidden="true">
      <div className={`absolute -left-10 top-10 h-40 w-40 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`} aria-hidden="true" />
      <div className={`absolute -bottom-10 right-16 h-40 w-40 rounded-full bg-gradient-to-tr ${currentTheme.primarySoft} blur-3xl`} aria-hidden="true" />

      <div className="relative min-w-0">
        <StaticBoardPreview currentTheme={currentTheme} isDarkMode={isDarkMode} />
      </div>

      <div className="relative hidden min-w-0 flex-col gap-4 lg:flex">
        <div className="scale-[0.86] origin-top">
          <LevelProgressCard
            username="you"
            fullName="You"
            level={sampleSummary.currentLevel}
            summary={sampleSummary}
            variant="console-strip"
            dataVariant="checkpoint-path"
            showAmbientGrid={false}
          />
        </div>
        <div className="origin-top -translate-y-10 scale-[0.82]">
          <LevelLeaderboardPreview
            board={sampleLeaderboard}
            period="week"
            onPeriodChange={() => undefined}
            variant="crown-stack"
            density="collapsed"
          />
        </div>
      </div>
    </div>
  );
}

function ProgressShowcase({
  currentTheme,
  isDarkMode,
}: {
  currentTheme: ThemeColors;
  isDarkMode: boolean;
}) {
  const mutedPanelClassName = getMutedPanelClassName(currentTheme, isDarkMode);

  return (
    <section id="progress" className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-[1450px]">
        <SectionHeading
          eyebrow="Progress loop"
          title="Gamification that looks like the product."
          description="XP, levels, milestones, and leaderboards use the same surfaces users see inside the board workspace."
          currentTheme={currentTheme}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[24rem_minmax(0,1fr)]">
          <LevelProgressCard
            username="you"
            fullName="You"
            level={sampleSummary.currentLevel}
            summary={sampleSummary}
            variant="console-strip"
            dataVariant="checkpoint-path"
            showAmbientGrid={false}
          />

          <div className="grid gap-5 md:grid-cols-3">
            {progressFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.label} className={`group rounded-[1.75rem] border p-5 transition-all duration-300 hover:-translate-y-1 ${mutedPanelClassName}`}>
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.primary} text-white shadow-lg transition-transform duration-300 group-hover:rotate-3`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className={`font-ui-condensed text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                    {feature.label}
                  </h3>
                  <p className={`mt-3 text-sm leading-6 ${currentTheme.textMuted}`}>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowShowcase({
  currentTheme,
  isDarkMode,
}: {
  currentTheme: ThemeColors;
  isDarkMode: boolean;
}) {
  const glassPanelClassName = getGlassPanelClassName(currentTheme, isDarkMode);
  const mutedPanelClassName = getMutedPanelClassName(currentTheme, isDarkMode);

  return (
    <section id="workflow" className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-[1450px]">
        <SectionHeading
          eyebrow="Workflow loop"
          title="Staging, estimation, delivery, history."
          description="The core Kanban loop stays recognizable: prepare work, estimate it together, move it through the board, then review what changed."
          currentTheme={currentTheme}
        />

        <div className={`mt-12 overflow-hidden rounded-[2rem] border p-5 backdrop-blur-xl ${glassPanelClassName}`}>
          <div className="grid gap-4 lg:grid-cols-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.label} className={`relative rounded-[1.5rem] border p-5 ${mutedPanelClassName}`}>
                  {index < workflowSteps.length - 1 ? (
                    <ChevronRight className={`absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 lg:block ${currentTheme.primaryText}`} aria-hidden="true" />
                  ) : null}
                  <div className="flex items-center justify-between gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.primary} text-white`}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <span className={`font-due-date text-sm ${currentTheme.textMuted}`}>0{index + 1}</span>
                  </div>
                  <h3 className={`mt-5 font-ui-condensed text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                    {step.label}
                  </h3>
                  <p className={`mt-3 text-sm leading-6 ${currentTheme.textMuted}`}>{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamShowcase({
  currentTheme,
  isDarkMode,
}: {
  currentTheme: ThemeColors;
  isDarkMode: boolean;
}) {
  const glassPanelClassName = getGlassPanelClassName(currentTheme, isDarkMode);
  const mutedPanelClassName = getMutedPanelClassName(currentTheme, isDarkMode);

  return (
    <section id="rituals" className="px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-[1450px] gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className={`font-ui-condensed text-sm font-semibold uppercase tracking-[0.16em] ${currentTheme.primaryText}`}>
            Team rituals
          </p>
          <h2 className={`mt-3 font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text} md:text-5xl`}>
            Planning poker uses the same language as the room.
          </h2>
          <p className={`mt-5 text-base leading-7 ${currentTheme.textSecondary}`}>
            Estimate staged work with the same card deck and task context your team uses inside a live planning poker room.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {teamFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.label} className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.primarySoftStrong} ${currentTheme.primaryText}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className={`font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                      {feature.label}
                    </h3>
                    <p className={`mt-1 text-sm leading-6 ${currentTheme.textMuted}`}>{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-[2rem] border p-5 backdrop-blur-xl ${glassPanelClassName}`} aria-hidden="true">
          <div className={`absolute -right-16 top-0 h-52 w-52 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} />
          <div className="relative space-y-5">
            <div className={`rounded-[1.75rem] border p-5 ${mutedPanelClassName}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={`font-ui-condensed text-sm font-semibold uppercase tracking-[0.14em] ${currentTheme.textMuted}`}>
                    Planning poker
                  </p>
                  <h3 className={`mt-1 font-ui-condensed text-2xl font-semibold ${currentTheme.text}`}>
                    Estimate onboarding flow
                  </h3>
                </div>
                <span className={`font-due-date rounded-full bg-gradient-to-r px-3 py-1 text-xs text-white ${currentTheme.primary}`}>
                  4/5 voted
                </span>
              </div>
            </div>
            <PlanningPokerVoteDeck
              cardValues={[0, 1, 2, 3, 5, 8, 13]}
              selectedValue={5}
              isSubmitting={false}
              disabled
              onVote={() => undefined}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonalShowcase({
  currentTheme,
  isDarkMode,
}: {
  currentTheme: ThemeColors;
  isDarkMode: boolean;
}) {
  const glassPanelClassName = getGlassPanelClassName(currentTheme, isDarkMode);
  const mutedPanelClassName = getMutedPanelClassName(currentTheme, isDarkMode);

  return (
    <section id="workspace" className="px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-[1450px] gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className={`relative overflow-hidden rounded-[2rem] border p-5 backdrop-blur-xl ${glassPanelClassName}`} aria-hidden="true">
          <div className="grid gap-4 md:grid-cols-2">
            <div className={`rounded-[1.5rem] border p-5 ${mutedPanelClassName}`}>
              <p className={`font-ui-condensed text-sm font-semibold uppercase tracking-[0.14em] ${currentTheme.textMuted}`}>
                My Tasks
              </p>
              <div className="mt-5 space-y-3">
                {previewTasks.map((task, index) => (
                  <div key={task.id} className={`rounded-2xl border p-3 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/62' : 'border-slate-200 bg-white/84'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>{task.title}</p>
                      <span className={`font-due-date text-xs ${index === 0 ? currentTheme.primaryText : currentTheme.textMuted}`}>
                        {index === 0 ? 'today' : `${index + 2}d`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="origin-top scale-[0.9]">
              <LevelLeaderboardPreview
                board={sampleLeaderboard}
                period="week"
                onPeriodChange={() => undefined}
                variant="crown-stack"
                density="collapsed"
              />
            </div>
          </div>
        </div>

        <div>
          <p className={`font-ui-condensed text-sm font-semibold uppercase tracking-[0.16em] ${currentTheme.primaryText}`}>
            Personal workspace
          </p>
          <h2 className={`mt-3 font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text} md:text-5xl`}>
            Every teammate gets a focused workspace.
          </h2>
          <p className={`mt-5 text-base leading-7 ${currentTheme.textSecondary}`}>
            Users can find assigned work, personalize theme feel, and see progress without hunting through the board.
          </p>
          <div className="mt-8 grid gap-3">
            {personalFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className={`h-5 w-5 ${currentTheme.primaryText}`} aria-hidden="true" />
                <span className={`text-sm font-semibold ${currentTheme.text}`}>{feature}</span>
              </div>
            ))}
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
          }

          @keyframes landing-float {
            from { transform: translate3d(0, 0, 0); }
            to { transform: translate3d(0, -10px, 0); }
          }

          @keyframes landing-pulse {
            0%, 100% { transform: scale(1); opacity: 0.92; }
            50% { transform: scale(1.035); opacity: 1; }
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
            {[
              ['Progress', '#progress'],
              ['Workflow', '#workflow'],
              ['Planning poker', '#rituals'],
              ['Workspace', '#workspace'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.textSecondary} transition-colors hover:${currentTheme.text}`}
              >
                {label}
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
            <ShineButton to="/register" currentTheme={currentTheme} className="h-10 px-4">
              Get started
            </ShineButton>
          </div>
        </div>
      </header>

      <section className="relative z-10 px-5 pb-20 pt-16 sm:px-8 lg:pb-28 lg:pt-24">
        <div className="mx-auto grid max-w-[1850px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="max-w-3xl">
            <div className={`landing-pulse mb-7 inline-flex items-center gap-2 rounded-full border px-3 py-2 ${getMutedPanelClassName(currentTheme, isDarkMode)}`}>
              <Flame className={`h-4 w-4 ${currentTheme.primaryText}`} aria-hidden="true" />
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
              <ShineButton to="/register" currentTheme={currentTheme} className="h-14 px-7 text-base">
                Start leveling up
              </ShineButton>
              <ShineButton to="/login" currentTheme={currentTheme} variant="secondary" className="h-14 px-7 text-base">
                Log in
              </ShineButton>
            </div>
          </div>

          <HeroWorkspacePreview currentTheme={currentTheme} isDarkMode={isDarkMode} />
        </div>
      </section>

      <div className="px-5 sm:px-8">
        <div className="mx-auto max-w-[1450px]">
          <WorkspaceSummaryBand
            title="One loop from staging to reward"
            description="Stage work, estimate it, move it through the board, and let progress show up in XP, levels, milestones, and history."
            icon={Sparkles}
            stats={[
              { label: 'Staged', value: 8, hint: 'tasks ready' },
              { label: 'Estimated', value: '5 pts', hint: 'latest vote' },
              { label: 'Weekly XP', value: '+840', hint: 'team momentum' },
              { label: 'Level', value: 18, hint: 'profile state' },
            ]}
          />
        </div>
      </div>

      <ProgressShowcase currentTheme={currentTheme} isDarkMode={isDarkMode} />
      <WorkflowShowcase currentTheme={currentTheme} isDarkMode={isDarkMode} />
      <TeamShowcase currentTheme={currentTheme} isDarkMode={isDarkMode} />
      <PersonalShowcase currentTheme={currentTheme} isDarkMode={isDarkMode} />

      <section className="px-5 py-24 sm:px-8">
        <div className={`relative mx-auto max-w-[1450px] overflow-hidden rounded-[2.25rem] border p-8 text-center backdrop-blur-xl md:p-12 ${glassPanelClassName}`}>
          <div className={`absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`} aria-hidden="true" />
          <div className="relative mx-auto max-w-3xl">
            <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${currentTheme.primary} text-white shadow-xl`}>
              <Zap className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className={`font-display-accent text-4xl font-bold leading-tight ${currentTheme.text} md:text-5xl`}>
              Ready to make progress visible?
            </p>
            <p className={`mx-auto mt-5 max-w-2xl text-base leading-7 ${currentTheme.textSecondary}`}>
              Start with one board. Stage tasks. Estimate as a team. Finish work and let the progress show up.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ShineButton to="/register" currentTheme={currentTheme} className="h-14 px-7 text-base">
                Create your account
              </ShineButton>
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
