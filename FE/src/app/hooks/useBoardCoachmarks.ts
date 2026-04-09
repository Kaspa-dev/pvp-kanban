import { useCallback, useEffect, useMemo, useState } from "react";
import { CoachmarkFlowId } from "../utils/userPreferences";

export type BoardWorkspaceView = "board" | "list" | "backlog" | "history";
type BoardCoachmarkFlowId =
  | "board-no-active-sprint"
  | "board-active-sprint"
  | "backlog-planning"
  | "backlog-active-sprint";

export type CoachmarkTargetId =
  | "toolbar-view-switcher"
  | "toolbar-search"
  | "board-empty-state-cta"
  | "active-sprint-banner"
  | "board-columns-grid"
  | "backlog-new-task"
  | "backlog-sprint-panel"
  | "backlog-active-sprint-banner"
  | "backlog-list";

export interface CoachmarkStep {
  targetId: CoachmarkTargetId;
  title: string;
  description: string;
}

interface UseBoardCoachmarksOptions {
  view: BoardWorkspaceView;
  hasActiveSprint: boolean;
  coachmarksEnabled: boolean;
  completedFlows: CoachmarkFlowId[];
  hasFetchedPreferences: boolean;
  isBlocked: boolean;
  onFlowCompleted: (flowId: CoachmarkFlowId) => void;
}

const FLOW_STEPS: Record<BoardCoachmarkFlowId, CoachmarkStep[]> = {
  "board-no-active-sprint": [
    {
      targetId: "toolbar-view-switcher",
      title: "Switch Your Workspace View",
      description: "Board, List, Backlog, and History stay one click away. Backlog is where you create and start sprints.",
    },
    {
      targetId: "board-empty-state-cta",
      title: "Start From Backlog",
      description: "There is no active sprint yet. Jump to Backlog to create a sprint and pull work into it.",
    },
  ],
  "board-active-sprint": [
    {
      targetId: "toolbar-view-switcher",
      title: "Switch Views Without Losing Context",
      description: "Use these tabs to move between the active board, list, backlog planning, and completed history.",
    },
    {
      targetId: "toolbar-search",
      title: "Search What Is On Screen",
      description: "Search filters the tasks in your current workspace so you can narrow the sprint quickly.",
    },
    {
      targetId: "active-sprint-banner",
      title: "Track The Current Sprint",
      description: "This header summarizes the active sprint dates and total task count for the work in progress.",
    },
    {
      targetId: "board-columns-grid",
      title: "Move Work Across Statuses",
      description: "Drag tasks between columns as work advances from To Do through Done.",
    },
  ],
  "backlog-planning": [
    {
      targetId: "backlog-new-task",
      title: "Capture New Work",
      description: "Create unscheduled tasks here before deciding when they belong in a sprint.",
    },
    {
      targetId: "backlog-sprint-panel",
      title: "Plan The Next Sprint",
      description: "Create a sprint, review its dates, add tasks, and start it when the sprint is ready.",
    },
    {
      targetId: "backlog-list",
      title: "Fill The Sprint From Backlog",
      description: "Keep future work here, then add the right tasks into the planned sprint when they are ready.",
    },
  ],
  "backlog-active-sprint": [
    {
      targetId: "backlog-active-sprint-banner",
      title: "This Sprint Is Already Running",
      description: "The current sprint is active, and you can complete it here when the planned work is finished.",
    },
    {
      targetId: "toolbar-view-switcher",
      title: "Use Board And List For Active Work",
      description: "Board and List focus on the active sprint, while Backlog stays available for upcoming work.",
    },
    {
      targetId: "backlog-new-task",
      title: "Keep Adding Future Work",
      description: "You can still create backlog tasks now so the next sprint is easier to plan later.",
    },
  ],
};

export function getCoachmarkFlowForView(
  view: BoardWorkspaceView,
  hasActiveSprint: boolean,
): BoardCoachmarkFlowId | null {
  if (view === "board") {
    return hasActiveSprint ? "board-active-sprint" : "board-no-active-sprint";
  }

  if (view === "backlog") {
    return hasActiveSprint ? "backlog-active-sprint" : "backlog-planning";
  }

  return null;
}

function getCoachmarkElement(targetId: CoachmarkTargetId): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-coachmark="${targetId}"]`);
}

export function useBoardCoachmarks({
  view,
  hasActiveSprint,
  coachmarksEnabled,
  completedFlows,
  hasFetchedPreferences,
  isBlocked,
  onFlowCompleted,
}: UseBoardCoachmarksOptions) {
  const [activeFlowId, setActiveFlowId] = useState<BoardCoachmarkFlowId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps = useMemo(
    () => (activeFlowId ? FLOW_STEPS[activeFlowId] : []),
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

  const startFlow = useCallback((flowId: BoardCoachmarkFlowId) => {
    setActiveFlowId(flowId);
    setStepIndex(0);
    setTargetRect(null);
  }, []);

  const goToNextStep = useCallback(() => {
    if (!activeFlowId) {
      return;
    }

    if (stepIndex >= FLOW_STEPS[activeFlowId].length - 1) {
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

    const flowId = getCoachmarkFlowForView(view, hasActiveSprint);
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
    hasActiveSprint,
    hasFetchedPreferences,
    isBlocked,
    startFlow,
    view,
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
