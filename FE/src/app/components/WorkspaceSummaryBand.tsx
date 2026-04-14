import { LucideIcon } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";

interface WorkspaceSummaryStat {
  label: string;
  value: string | number;
  hint?: string;
}

interface WorkspaceSummaryBandProps {
  title: string;
  description: string;
  icon: LucideIcon;
  stats: WorkspaceSummaryStat[];
  dataCoachmark?: string;
}

export function WorkspaceSummaryBand({
  title,
  description,
  icon: Icon,
  stats,
  dataCoachmark,
}: WorkspaceSummaryBandProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <section
      className={`relative overflow-hidden rounded-[30px] border px-6 py-6 ${currentTheme.border} ${currentTheme.cardBg} shadow-[0_20px_50px_-34px_rgba(15,23,42,0.45)]`}
      data-coachmark={dataCoachmark}
    >
      <div className={`pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-gradient-to-tr ${currentTheme.primarySoft} blur-3xl`} />
      <div className={`pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-gradient-to-bl ${currentTheme.primarySoftStrong} blur-3xl`} />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.primary}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-xl font-bold ${currentTheme.text}`}>{title}</h2>
              <p className={`mt-1 max-w-2xl text-sm leading-relaxed ${currentTheme.textMuted}`}>
                {description}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`min-w-[9rem] rounded-2xl border px-4 py-3 ${currentTheme.border} ${isDarkMode ? "bg-black/20" : "bg-white/80"} backdrop-blur-sm`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                  {stat.label}
                </p>
                <p className={`mt-2 text-2xl font-bold leading-none ${currentTheme.text}`}>{stat.value}</p>
                {stat.hint && (
                  <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{stat.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
