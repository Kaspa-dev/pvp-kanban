import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "../utils/labels";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { CustomScrollArea } from "./CustomScrollArea";
import { OverflowTooltip } from "./OverflowTooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { useIsMobile } from "./ui/use-mobile";

interface TaskLabelSummaryProps {
  labels: Label[];
  maxVisible?: number;
  compactMaxVisible?: number;
  align?: "left" | "center";
  collapseToFit?: boolean;
  overflowText?: (hiddenCount: number) => string;
}

export function TaskLabelSummary({
  labels,
  maxVisible = 2,
  compactMaxVisible = 1,
  align = "left",
  collapseToFit = false,
  overflowText = (hiddenCount) => `+${hiddenCount} more`,
}: TaskLabelSummaryProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelMeasureRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const overflowMeasureRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  const effectiveMaxVisible = isMobile ? compactMaxVisible : maxVisible;
  const baseChipClassName = "inline-flex h-6 min-w-0 max-w-full items-center justify-center rounded-md px-2 text-xs font-medium leading-none whitespace-nowrap";
  const [resolvedVisibleCount, setResolvedVisibleCount] = useState(effectiveMaxVisible);

  useEffect(() => {
    if (!collapseToFit) {
      setResolvedVisibleCount(effectiveMaxVisible);
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const gapPx = 6;

    const updateVisibleCount = () => {
      const availableWidth = container.clientWidth;
      if (availableWidth <= 0) {
        return;
      }

      const maxCandidate = Math.min(effectiveMaxVisible, labels.length);

      for (let candidate = maxCandidate; candidate >= 0; candidate -= 1) {
        const hiddenCount = labels.length - candidate;
        let requiredWidth = 0;

        for (let index = 0; index < candidate; index += 1) {
          const chipWidth = labelMeasureRefs.current[index]?.offsetWidth ?? 0;
          requiredWidth += chipWidth;
        }

        if (candidate > 1) {
          requiredWidth += gapPx * (candidate - 1);
        }

        if (hiddenCount > 0) {
          const overflowWidth = overflowMeasureRefs.current[hiddenCount]?.offsetWidth ?? 0;
          if (candidate > 0) {
            requiredWidth += gapPx;
          }
          requiredWidth += overflowWidth;
        }

        if (requiredWidth <= availableWidth || candidate === 0) {
          setResolvedVisibleCount((currentCount) =>
            currentCount === candidate ? currentCount : candidate,
          );
          return;
        }
      }
    };

    updateVisibleCount();

    const resizeObserver = new ResizeObserver(() => {
      updateVisibleCount();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [collapseToFit, effectiveMaxVisible, labels, overflowText]);

  const visibleCount = collapseToFit ? resolvedVisibleCount : effectiveMaxVisible;
  const visibleLabels = labels.slice(0, visibleCount);
  const hiddenLabels = labels.slice(visibleCount);
  const getOverflowSummaryText = (nextVisibleCount: number, hiddenCount: number) =>
    nextVisibleCount === 0
      ? `${labels.length} label${labels.length === 1 ? "" : "s"}`
      : overflowText(hiddenCount);
  const overflowCounts = useMemo(
    () => Array.from({ length: labels.length }, (_, index) => index + 1),
    [labels.length],
  );

  if (labels.length === 0) {
    return null;
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`flex min-w-0 max-w-full items-center gap-1.5 ${
          collapseToFit ? "flex-1 flex-nowrap overflow-hidden" : "flex-wrap"
        } ${align === "center" ? "justify-center" : ""}`}
      >
      {visibleLabels.map((label) => (
        <OverflowTooltip
          key={label.id}
          text={label.name}
          className={`${baseChipClassName} max-w-[6.25rem] shrink-0 truncate text-white sm:max-w-[7.5rem]`}
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
                  ? "bg-zinc-800 text-zinc-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-zinc-700"
                  : "bg-white text-gray-600 shadow-[inset_0_0_0_1px_rgba(156,163,175,0.42)] hover:bg-gray-50"
              }`}
            >
              {getOverflowSummaryText(visibleCount, hiddenLabels.length)}
            </button>
          </HoverCardTrigger>
          <HoverCardContent
            side="top"
            align={align === "center" ? "center" : "start"}
            className={`w-56 rounded-xl border p-3 shadow-[0_24px_64px_rgba(0,0,0,0.42)] ${isDarkMode ? "shadow-black/55" : "shadow-slate-900/18"} ${currentTheme.cardBg} ${currentTheme.border}`}
          >
            <CustomScrollArea viewportClassName="max-h-40 py-1 pr-1">
              <div className="flex flex-wrap gap-2">
                {hiddenLabels.map((label) => (
                  <OverflowTooltip
                    key={label.id}
                    text={label.name}
                    className={`${baseChipClassName} max-w-[10.5rem] shrink-0 truncate text-white`}
                    style={{ backgroundColor: label.color }}
                  />
                ))}
              </div>
            </CustomScrollArea>
          </HoverCardContent>
        </HoverCard>
      )}
      </div>

      {collapseToFit ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 -z-10 flex flex-nowrap items-center gap-1.5 overflow-hidden opacity-0"
        >
          {labels.map((label, index) => (
            <span
              key={label.id}
              ref={(element) => {
                labelMeasureRefs.current[index] = element;
              }}
              className={`${baseChipClassName} max-w-[6.25rem] shrink-0 truncate text-white sm:max-w-[7.5rem]`}
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
          {overflowCounts.map((count) => (
            <span
              key={`overflow-${count}`}
              ref={(element) => {
                overflowMeasureRefs.current[count] = element;
              }}
              className={`${baseChipClassName} shrink-0 transition-colors ${
                isDarkMode
                  ? "bg-zinc-800 text-zinc-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "bg-white text-gray-600 shadow-[inset_0_0_0_1px_rgba(156,163,175,0.42)]"
              }`}
            >
              {getOverflowSummaryText(labels.length - count, count)}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
