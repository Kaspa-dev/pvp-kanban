import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { getMilestoneCategoryLabel, UserMilestone } from "../../utils/milestones";
import { getPanelEyebrowClassName } from "../typographyStyles";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { UtilityIconButton } from "../UtilityIconButton";
import { MilestoneCard } from "./MilestoneCard";

interface MilestoneSectionProps {
  category: string;
  milestones: UserMilestone[];
}

export function MilestoneSection({ category, milestones }: MilestoneSectionProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const panelEyebrowClassName = getPanelEyebrowClassName(currentTheme.textMuted);
  const [isExpanded, setIsExpanded] = useState(true);
  const sectionContentId = `milestone-section-content-${category}`;

  return (
    <section
      className={`rounded-[2rem] border ${currentTheme.border} ${currentTheme.cardBg} px-6 py-6 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.45)]`}
      aria-labelledby={`milestone-section-${category}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id={`milestone-section-${category}`} className={`font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
            {getMilestoneCategoryLabel(category)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className={`${panelEyebrowClassName} inline-flex items-center rounded-full px-3 py-1.5 ${currentTheme.primaryBg} ${currentTheme.primaryText}`}>
            <span className="font-due-date">{milestones.length}</span>&nbsp;milestones
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <UtilityIconButton
                type="button"
                size="sm"
                onClick={() => setIsExpanded((current) => !current)}
                aria-label={isExpanded ? `Collapse ${getMilestoneCategoryLabel(category)} milestones` : `Expand ${getMilestoneCategoryLabel(category)} milestones`}
                aria-expanded={isExpanded}
                aria-controls={sectionContentId}
              >
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`} />
              </UtilityIconButton>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {isExpanded ? "Collapse section" : "Expand section"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {isExpanded ? (
        <div id={sectionContentId} className={`mt-5 border-t pt-5 ${currentTheme.border}`}>
          <div className="grid gap-4 xl:grid-cols-2">
            {milestones.map((milestone) => (
              <MilestoneCard key={milestone.key} milestone={milestone} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
