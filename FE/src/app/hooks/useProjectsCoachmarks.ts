import { useCallback, useEffect, useMemo, useState } from "react";
import { CoachmarkFlowId } from "../utils/userPreferences";

export type ProjectsCoachmarkTargetId =
  | "projects-empty-create"
  | "projects-settings-help"
  | "projects-create-board"
  | "projects-search-filters"
  | "projects-board-grid"
  | "projects-board-card";

export interface ProjectsCoachmarkStep {
  targetId: ProjectsCoachmarkTargetId;
  title: string;
  description: string;
}

interface UseProjectsCoachmarksOptions {
  hasAnyBoards: boolean;
  hasVisibleBoardCards: boolean;
  coachmarksEnabled: boolean;
  completedFlows: CoachmarkFlowId[];
  hasFetchedPreferences: boolean;
  isBlocked: boolean;
  onFlowCompleted: (flowId: CoachmarkFlowId) => void;
}

const PROJECTS_FLOW_STEPS: Record<"projects-empty-state" | "projects-board-list", ProjectsCoachmarkStep[]> = {
  "projects-empty-state": [
    {
      targetId: "projects-empty-create",
      title: "Create Your First Project",
      description: "Start here to create a board, invite teammates, and set up the first place your work will live.",
    },
    {
      targetId: "projects-settings-help",
      title: "Replay Coachmarks Anytime",
      description: "Use this help entry to bring the walkthrough back later, and open Settings when you want to manage coachmarks.",
    },
  ],
  "projects-board-list": [
    {
      targetId: "projects-create-board",
      title: "Add Another Project",
      description: "Create a new board whenever you need a fresh workspace for a team, initiative, or feature stream.",
    },
    {
      targetId: "projects-search-filters",
      title: "Narrow The List Fast",
      description: "Search, sorting, and quick filters help you focus on the exact boards you want to open.",
    },
    {
      targetId: "projects-board-grid",
      title: "Browse Your Boards",
      description: "This grid shows the boards you can access so you can jump straight into the right workspace.",
    },
    {
      targetId: "projects-board-card",
      title: "Scan Board Status At A Glance",
      description: "Each card highlights the board identity, teammates, and management actions so you can understand a workspace before opening it.",
    },
  ],
};

export function getProjectsCoachmarkFlow(
  hasAnyBoards: boolean,
  hasVisibleBoardCards: boolean,
): CoachmarkFlowId | null {
  if (!hasAnyBoards) {
    return "projects-empty-state";
  }

  if (hasVisibleBoardCards) {
    return "projects-board-list";
  }

  return null;
}

function getCoachmarkElement(targetId: ProjectsCoachmarkTargetId): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-coachmark="${targetId}"]`);
}

export function useProjectsCoachmarks({
  hasAnyBoards,
  hasVisibleBoardCards,
  coachmarksEnabled,
  completedFlows,
  hasFetchedPreferences,
  isBlocked,
  onFlowCompleted,
}: UseProjectsCoachmarksOptions) {
  const [activeFlowId, setActiveFlowId] = useState<CoachmarkFlowId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps = useMemo(
    () =>
      activeFlowId === "projects-empty-state" || activeFlowId === "projects-board-list"
        ? PROJECTS_FLOW_STEPS[activeFlowId]
        : [],
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
      onFlowCompleted(activeFlowId);
    }

    setActiveFlowId(null);
    setStepIndex(0);
    setTargetRect(null);
  }, [activeFlowId, onFlowCompleted]);

  const startFlow = useCallback((flowId: CoachmarkFlowId) => {
    if (flowId !== "projects-empty-state" && flowId !== "projects-board-list") {
      return;
    }

    setActiveFlowId(flowId);
    setStepIndex(0);
    setTargetRect(null);
  }, []);

  const goToNextStep = useCallback(() => {
    if (activeFlowId !== "projects-empty-state" && activeFlowId !== "projects-board-list") {
      return;
    }

    if (stepIndex >= PROJECTS_FLOW_STEPS[activeFlowId].length - 1) {
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

    const flowId = getProjectsCoachmarkFlow(hasAnyBoards, hasVisibleBoardCards);
    if (!flowId || completedFlows.includes(flowId)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startFlow(flowId);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    activeFlowId,
    coachmarksEnabled,
    completedFlows,
    hasAnyBoards,
    hasFetchedPreferences,
    hasVisibleBoardCards,
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
