import { X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { useIsMobile } from "./ui/use-mobile";

interface CoachmarkOverlayStep {
  title: string;
  description: string;
}

interface CoachmarkOverlayProps {
  isOpen: boolean;
  step: CoachmarkOverlayStep | null;
  targetRect: DOMRect | null;
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}

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

  if (!isOpen || !step) {
    return null;
  }

  const highlightStyle = targetRect
    ? {
        left: Math.max(8, targetRect.left - 8),
        top: Math.max(8, targetRect.top - 8),
        width: targetRect.width + 16,
        height: targetRect.height + 16,
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[1.5px]" aria-hidden="true" />

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
            <button
              type="button"
              onClick={onClose}
              className={`rounded-full p-2 transition-colors ${currentTheme.textMuted} hover:${currentTheme.textSecondary} hover:${currentTheme.bgSecondary}`}
              aria-label="Close hints"
            >
              <X className="h-4 w-4" />
            </button>
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
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${currentTheme.textSecondary} ${currentTheme.bgSecondary} transition-all hover:scale-[1.01]`}
            >
              Skip
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={stepIndex === 0}
                className={`rounded-xl border ${currentTheme.border} px-4 py-2 text-sm font-semibold ${currentTheme.text} transition-all disabled:cursor-not-allowed disabled:opacity-40`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={onNext}
                className={`rounded-xl bg-gradient-to-r ${currentTheme.primary} px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.01]`}
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
