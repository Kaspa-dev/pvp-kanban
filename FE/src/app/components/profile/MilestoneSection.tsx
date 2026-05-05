import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { getMilestoneCategoryDescription, getMilestoneCategoryLabel, UserMilestone } from "../../utils/milestones";
import { MilestoneCard } from "./MilestoneCard";

interface MilestoneSectionProps {
  category: string;
  milestones: UserMilestone[];
}

export function MilestoneSection({ category, milestones }: MilestoneSectionProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <section
      className="space-y-5"
      aria-labelledby={`milestone-section-${category}`}
    >
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>Category</p>
          <h2 id={`milestone-section-${category}`} className={`mt-2 text-2xl font-semibold ${currentTheme.text}`}>
            {getMilestoneCategoryLabel(category)}
          </h2>
          <p className={`mt-2 max-w-2xl text-sm leading-6 ${currentTheme.textSecondary}`}>
            {getMilestoneCategoryDescription(category)}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${currentTheme.primaryBg} ${currentTheme.primaryText}`}>
          {milestones.length} achievements
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {milestones.map((milestone) => (
          <MilestoneCard key={milestone.key} milestone={milestone} />
        ))}
      </div>
    </section>
  );
}
