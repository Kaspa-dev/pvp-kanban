import { useCallback, useEffect, useMemo, useState } from "react";
import { CoachmarkFlowId } from "../utils/userPreferences";

type PageCoachmarkFlowId =
  | "my-tasks-overview"
  | "profile-overview"
  | "profile-milestones-overview";

type PageCoachmarkTargetId =
  | "my-tasks-header"
  | "my-tasks-filters"
  | "my-tasks-table"
  | "my-tasks-pagination"
  | "profile-identity"
  | "profile-level-progress"
  | "profile-xp-stats"
  | "profile-milestones"
  | "profile-danger-zone"
  | "profile-milestones-header"
  | "profile-milestones-summary"
  | "profile-milestones-list";

export interface PageCoachmarkStep {
  targetId: PageCoachmarkTargetId;
  title: string;
  description: string;
}

interface UsePageCoachmarksOptions {
  flowId: PageCoachmarkFlowId;
  coachmarksEnabled: boolean;
  completedFlows: CoachmarkFlowId[];
  hasFetchedPreferences: boolean;
  isBlocked: boolean;
  onFlowCompleted: (flowId: CoachmarkFlowId) => void;
}

const PAGE_FLOW_STEPS: Record<PageCoachmarkFlowId, PageCoachmarkStep[]> = {
  "my-tasks-overview": [
    {
      targetId: "my-tasks-header",
      title: "Your Assigned Work",
      description: "My Tasks gathers the work assigned to you across every board you can access.",
    },
    {
      targetId: "my-tasks-filters",
      title: "Focus The Task List",
      description: "Search, scope, board, priority, and task-type filters help you narrow the view without leaving this page.",
    },
    {
      targetId: "my-tasks-table",
      title: "Scan Task Context",
      description: "The table keeps each task's board, due date, status, priority, and story points together for quick triage.",
    },
    {
      targetId: "my-tasks-pagination",
      title: "Move Through Results",
      description: "Use the pagination controls or keyboard hints to step through longer assigned-task lists.",
    },
  ],
  "profile-overview": [
    {
      targetId: "profile-identity",
      title: "Profile Identity",
      description: "Review your avatar, account identity, and profile edit action from the top of the page.",
    },
    {
      targetId: "profile-level-progress",
      title: "Level Progress",
      description: "This progress band shows your current level and how much XP remains before the next one.",
    },
    {
      targetId: "profile-xp-stats",
      title: "XP Snapshot",
      description: "Lifetime, weekly, monthly, and completed-task stats summarize your recent contribution pace.",
    },
    {
      targetId: "profile-milestones",
      title: "Milestone Preview",
      description: "The milestone panel highlights recent unlocks or upcoming achievements and links to the full milestone shelf.",
    },
    {
      targetId: "profile-danger-zone",
      title: "Account Safety",
      description: "Account deletion stays isolated at the bottom with an explicit confirmation so routine profile work stays separate.",
    },
  ],
  "profile-milestones-overview": [
    {
      targetId: "profile-milestones-header",
      title: "Milestone Shelf",
      description: "This page expands your achievements into a dedicated view with progress, locked, and unlocked milestones.",
    },
    {
      targetId: "profile-milestones-summary",
      title: "Completion Summary",
      description: "The summary shows overall completion plus counts for unlocked, in-progress, and locked milestones.",
    },
    {
      targetId: "profile-milestones-list",
      title: "Browse By Category",
      description: "Milestones are grouped into collapsible categories so you can scan progress without losing the bigger picture.",
    },
  ],
};

function getCoachmarkElement(targetId: PageCoachmarkTargetId): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-coachmark="${targetId}"]`);
}

export function usePageCoachmarks({
  flowId,
  coachmarksEnabled,
  completedFlows,
  hasFetchedPreferences,
  isBlocked,
  onFlowCompleted,
}: UsePageCoachmarksOptions) {
  const [activeFlowId, setActiveFlowId] = useState<PageCoachmarkFlowId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [dismissedFlowId, setDismissedFlowId] = useState<PageCoachmarkFlowId | null>(null);

  const steps = useMemo(
    () => (activeFlowId ? PAGE_FLOW_STEPS[activeFlowId] : []),
    [activeFlowId],
  );

  const activeStep = steps[stepIndex] ?? null;

  const resolveCurrentTarget = useCallback(() => {
    if (!activeStep) {
      setTargetRect(null);
      return;
    }

    const element = getCoachmarkElement(activeStep.targetId);
    if (!element) {
      setTargetRect(null);
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });

    requestAnimationFrame(() => {
      setTargetRect(element.getBoundingClientRect());
    });
  }, [activeStep]);

  const closeFlow = useCallback((markCompleted: boolean) => {
    if (activeFlowId && markCompleted) {
      setDismissedFlowId(activeFlowId);
      onFlowCompleted(activeFlowId);
    }

    setActiveFlowId(null);
    setStepIndex(0);
    setTargetRect(null);
  }, [activeFlowId, onFlowCompleted]);

  const startFlow = useCallback(() => {
    setDismissedFlowId(null);
    setActiveFlowId(flowId);
    setStepIndex(0);
    setTargetRect(null);
  }, [flowId]);

  const goToNextStep = useCallback(() => {
    if (!activeFlowId) {
      return;
    }

    if (stepIndex >= PAGE_FLOW_STEPS[activeFlowId].length - 1) {
      closeFlow(true);
      return;
    }

    setStepIndex((currentStepIndex) => currentStepIndex + 1);
  }, [activeFlowId, closeFlow, stepIndex]);

  const goToPreviousStep = useCallback(() => {
    setStepIndex((currentStepIndex) => Math.max(0, currentStepIndex - 1));
  }, []);

  useEffect(() => {
    if (!activeStep) {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timeoutId: number | undefined;

    const updateTarget = () => {
      if (cancelled) {
        return;
      }

      const element = getCoachmarkElement(activeStep.targetId);
      if (!element) {
        if (attempts < 20) {
          attempts += 1;
          timeoutId = window.setTimeout(updateTarget, 120);
          return;
        }

        closeFlow(false);
        return;
      }

      element.scrollIntoView({
        behavior: attempts === 0 ? "auto" : "smooth",
        block: "center",
        inline: "center",
      });

      requestAnimationFrame(() => {
        if (!cancelled) {
          setTargetRect(element.getBoundingClientRect());
        }
      });
    };

    updateTarget();

    const handleWindowUpdate = () => {
      resolveCurrentTarget();
    };

    window.addEventListener("resize", handleWindowUpdate);
    window.addEventListener("scroll", handleWindowUpdate, true);

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener("resize", handleWindowUpdate);
      window.removeEventListener("scroll", handleWindowUpdate, true);
    };
  }, [activeStep, closeFlow, resolveCurrentTarget]);

  useEffect(() => {
    if (!activeFlowId) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeFlow(true);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeFlowId, closeFlow]);

  useEffect(() => {
    if (activeFlowId || isBlocked || !hasFetchedPreferences || !coachmarksEnabled) {
      return;
    }

    if (completedFlows.includes(flowId) || dismissedFlowId === flowId) {
      return;
    }

    const timeoutId = window.setTimeout(startFlow, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    activeFlowId,
    coachmarksEnabled,
    completedFlows,
    dismissedFlowId,
    flowId,
    hasFetchedPreferences,
    isBlocked,
    startFlow,
  ]);

  return {
    activeFlowId,
    activeStep,
    stepIndex,
    totalSteps: steps.length,
    targetRect,
    startFlow,
    closeFlow,
    goToNextStep,
    goToPreviousStep,
  };
}
