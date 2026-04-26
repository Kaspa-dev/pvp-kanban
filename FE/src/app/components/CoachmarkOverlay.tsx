import { X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { UtilityIconButton } from "./UtilityIconButton";
import { useIsMobile } from "./ui/use-mobile";

interface CoachmarkOverlayStep {
  title: string;
  description: string;
}

interface CoachmarkOverlayProps {
  isOpen: boolean;
  step: CoachmarkOverlayStep | null;
  targetRect: DOMRect | null;
  spotlightPadding?: number;
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}

const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_RADIUS = 16;

function getDesktopCardStyle(targetRect: DOMRect | null): CSSProperties {
  const cardWidth = 340;
  const cardHeight = 220;
  const gap = 20;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const fallback = {
    left: Math.max(24, Math.min((viewportWidth - cardWidth) / 2, viewportWidth - cardWidth - 24)),
    top: Math.max(24, Math.min((viewportHeight - cardHeight) / 2, viewportHeight - cardHeight - 24)),
  };

  if (!targetRect) {
    return fallback;
  }

  const candidates = [
    {
      left: targetRect.right + gap,
      top: targetRect.top + Math.max(0, (targetRect.height - cardHeight) / 2),
      fits: targetRect.right + gap + cardWidth <= viewportWidth - 24,
    },
    {
      left: targetRect.left - gap - cardWidth,
      top: targetRect.top + Math.max(0, (targetRect.height - cardHeight) / 2),
      fits: targetRect.left - gap - cardWidth >= 24,
    },
    {
      left: targetRect.left + Math.max(0, (targetRect.width - cardWidth) / 2),
      top: targetRect.bottom + gap,
      fits: targetRect.bottom + gap + cardHeight <= viewportHeight - 24,
    },
    {
      left: targetRect.left + Math.max(0, (targetRect.width - cardWidth) / 2),
      top: targetRect.top - gap - cardHeight,
      fits: targetRect.top - gap - cardHeight >= 24,
    },
  ];

  const selectedCandidate = candidates.find((candidate) => candidate.fits) ?? candidates[0];

  return {
    left: Math.max(24, Math.min(selectedCandidate.left, viewportWidth - cardWidth - 24)),
    top: Math.max(24, Math.min(selectedCandidate.top, viewportHeight - cardHeight - 24)),
    width: cardWidth,
  };
}

export function CoachmarkOverlay({
  isOpen,
  step,
  targetRect,
  spotlightPadding = SPOTLIGHT_PADDING,
  stepIndex,
  totalSteps,
  onBack,
  onNext,
  onClose,
}: CoachmarkOverlayProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const isMobile = useIsMobile();
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      cardRef.current?.focus();
    }
  }, [isOpen, stepIndex]);

  const desktopStyle = useMemo(
    () => (isOpen && !isMobile ? getDesktopCardStyle(targetRect) : undefined),
    [isMobile, isOpen, targetRect],
  );
  const coachmarkSecondaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 ${
    currentTheme.focus
  } ${isDarkMode ? "border-zinc-700 text-zinc-100 hover:bg-zinc-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`;
  const coachmarkPrimaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`;

  if (!isOpen || !step) {
    return null;
  }

  const highlightStyle = targetRect
    ? {
        left: Math.max(0, targetRect.left - spotlightPadding),
        top: Math.max(0, targetRect.top - spotlightPadding),
        width: targetRect.width + spotlightPadding * 2,
        height: targetRect.height + spotlightPadding * 2,
      }
    : undefined;

  const spotlightPanels = highlightStyle
    ? {
        top: {
          left: 0,
          top: 0,
          width: "100%",
          height: `${highlightStyle.top}px`,
        } satisfies CSSProperties,
        bottom: {
          left: 0,
          top: `${highlightStyle.top + highlightStyle.height}px`,
          width: "100%",
          bottom: 0,
        } satisfies CSSProperties,
        left: {
          left: 0,
          top: `${highlightStyle.top}px`,
          width: `${highlightStyle.left}px`,
          height: `${highlightStyle.height}px`,
        } satisfies CSSProperties,
        right: {
          left: `${highlightStyle.left + highlightStyle.width}px`,
          top: `${highlightStyle.top}px`,
          right: 0,
          height: `${highlightStyle.height}px`,
        } satisfies CSSProperties,
      }
    : null;

  const overlayPanelClassName = "absolute bg-black/55 backdrop-blur-[1.5px]";
  const spotlightCornerOverlays = highlightStyle
    ? [
        {
          key: "top-left",
          style: {
            left: `${highlightStyle.left}px`,
            top: `${highlightStyle.top}px`,
            width: `${SPOTLIGHT_RADIUS}px`,
            height: `${SPOTLIGHT_RADIUS}px`,
            WebkitMaskImage: `radial-gradient(circle at bottom right, transparent ${SPOTLIGHT_RADIUS - 1}px, black ${SPOTLIGHT_RADIUS}px)`,
            maskImage: `radial-gradient(circle at bottom right, transparent ${SPOTLIGHT_RADIUS - 1}px, black ${SPOTLIGHT_RADIUS}px)`,
          } satisfies CSSProperties,
        },
        {
          key: "top-right",
          style: {
            left: `${highlightStyle.left + highlightStyle.width - SPOTLIGHT_RADIUS}px`,
            top: `${highlightStyle.top}px`,
            width: `${SPOTLIGHT_RADIUS}px`,
            height: `${SPOTLIGHT_RADIUS}px`,
            WebkitMaskImage: `radial-gradient(circle at bottom left, transparent ${SPOTLIGHT_RADIUS - 1}px, black ${SPOTLIGHT_RADIUS}px)`,
            maskImage: `radial-gradient(circle at bottom left, transparent ${SPOTLIGHT_RADIUS - 1}px, black ${SPOTLIGHT_RADIUS}px)`,
          } satisfies CSSProperties,
        },
        {
          key: "bottom-left",
          style: {
            left: `${highlightStyle.left}px`,
            top: `${highlightStyle.top + highlightStyle.height - SPOTLIGHT_RADIUS}px`,
            width: `${SPOTLIGHT_RADIUS}px`,
            height: `${SPOTLIGHT_RADIUS}px`,
            WebkitMaskImage: `radial-gradient(circle at top right, transparent ${SPOTLIGHT_RADIUS - 1}px, black ${SPOTLIGHT_RADIUS}px)`,
            maskImage: `radial-gradient(circle at top right, transparent ${SPOTLIGHT_RADIUS - 1}px, black ${SPOTLIGHT_RADIUS}px)`,
          } satisfies CSSProperties,
        },
        {
          key: "bottom-right",
          style: {
            left: `${highlightStyle.left + highlightStyle.width - SPOTLIGHT_RADIUS}px`,
            top: `${highlightStyle.top + highlightStyle.height - SPOTLIGHT_RADIUS}px`,
            width: `${SPOTLIGHT_RADIUS}px`,
            height: `${SPOTLIGHT_RADIUS}px`,
            WebkitMaskImage: `radial-gradient(circle at top left, transparent ${SPOTLIGHT_RADIUS - 1}px, black ${SPOTLIGHT_RADIUS}px)`,
            maskImage: `radial-gradient(circle at top left, transparent ${SPOTLIGHT_RADIUS - 1}px, black ${SPOTLIGHT_RADIUS}px)`,
          } satisfies CSSProperties,
        },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-[120]">
      {spotlightPanels ? (
        <>
          <div aria-hidden="true" className={overlayPanelClassName} style={spotlightPanels.top} />
          <div aria-hidden="true" className={overlayPanelClassName} style={spotlightPanels.bottom} />
          <div aria-hidden="true" className={overlayPanelClassName} style={spotlightPanels.left} />
          <div aria-hidden="true" className={overlayPanelClassName} style={spotlightPanels.right} />
          {spotlightCornerOverlays.map((corner) => (
            <div
              key={corner.key}
              aria-hidden="true"
              className={overlayPanelClassName}
              style={corner.style}
            />
          ))}
        </>
      ) : (
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1.5px]" aria-hidden="true" />
      )}

      {highlightStyle && (
        <div
          aria-hidden="true"
          className={`absolute rounded-2xl border-2 ${currentTheme.primaryBorder} ring-4 ${currentTheme.ring} shadow-[0_0_0_9999px_rgba(0,0,0,0.1)] transition-all duration-200`}
          style={highlightStyle}
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coachmark-title"
        aria-describedby="coachmark-description"
        tabIndex={-1}
        className={`absolute outline-none ${isMobile ? "inset-x-4 bottom-4" : ""}`}
        style={desktopStyle}
      >
        <div
          className={`rounded-3xl border ${currentTheme.border} ${currentTheme.cardBg} shadow-2xl ${
            isMobile ? "mx-auto max-w-xl p-5" : "p-6"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.primaryText}`}>
                Hint {stepIndex + 1} of {totalSteps}
              </p>
              <h2 id="coachmark-title" className={`mt-2 text-xl font-bold ${currentTheme.text}`}>
                {step.title}
              </h2>
            </div>
            <UtilityIconButton
              onClick={onClose}
              size="sm"
              emphasis="default"
              aria-label="Close hints"
            >
              <X className="h-4 w-4" />
            </UtilityIconButton>
          </div>

          <p id="coachmark-description" className={`mt-3 text-sm leading-6 ${currentTheme.textSecondary}`}>
            {step.description}
          </p>

          <div aria-live="polite" className="sr-only">
            {step.title}. {step.description}
          </div>

          <div className={`mt-6 flex items-center justify-between gap-3 border-t ${currentTheme.border} pt-4`}>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium ${currentTheme.textMuted} transition-colors ${currentTheme.accentIconButtonHover}`}
            >
              Skip
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={stepIndex === 0}
                className={coachmarkSecondaryActionButtonClassName}
              >
                Back
              </button>
              <button
                type="button"
                onClick={onNext}
                className={coachmarkPrimaryActionButtonClassName}
              >
                {stepIndex === totalSteps - 1 ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
