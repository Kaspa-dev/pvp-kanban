import { Label } from "../utils/labels";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { CustomScrollArea } from "./CustomScrollArea";
import { OverflowTooltip } from "./OverflowTooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";

interface TaskLabelSummaryProps {
  labels: Label[];
  maxVisible?: number;
  align?: "left" | "center";
  overflowText?: (hiddenCount: number) => string;
}

export function TaskLabelSummary({
  labels,
  maxVisible = 2,
  align = "left",
  overflowText = (hiddenCount) => `+${hiddenCount} more`,
}: TaskLabelSummaryProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  if (labels.length === 0) {
    return null;
  }

  const visibleLabels = labels.slice(0, maxVisible);
  const hiddenLabels = labels.slice(maxVisible);
  const baseChipClassName = "inline-flex h-6 min-w-0 items-center justify-center rounded-md px-2 text-xs font-medium leading-none whitespace-nowrap";

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-1.5 ${align === "center" ? "justify-center" : ""}`}>
      {visibleLabels.map((label) => (
        <OverflowTooltip
          key={label.id}
          text={label.name}
          className={`${baseChipClassName} max-w-[7.5rem] truncate text-white`}
          style={{ backgroundColor: label.color }}
        />
      ))}

      {hiddenLabels.length > 0 && (
        <HoverCard openDelay={120} closeDelay={90}>
          <HoverCardTrigger asChild>
            <button
              type="button"
              className={`${baseChipClassName} shrink-0 transition-colors ${
                isDarkMode
                  ? "bg-white/[0.04] text-zinc-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] hover:bg-white/[0.07]"
                  : "bg-slate-50 text-slate-600 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.42)] hover:bg-slate-100"
              }`}
            >
              {overflowText(hiddenLabels.length)}
            </button>
          </HoverCardTrigger>
          <HoverCardContent
            side="top"
            align={align === "center" ? "center" : "start"}
            className={`w-56 rounded-xl border p-3 shadow-lg ${currentTheme.cardBg} ${currentTheme.border}`}
          >
            <p className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
              More labels
            </p>
            <CustomScrollArea viewportClassName="max-h-40 py-1 pr-1">
              <div className="space-y-2">
                {hiddenLabels.map((label) => (
                  <div key={label.id} className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
                    <span className={`whitespace-nowrap text-sm ${currentTheme.text}`}>{label.name}</span>
                  </div>
                ))}
              </div>
            </CustomScrollArea>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}
