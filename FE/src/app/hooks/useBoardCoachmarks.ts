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
  | "workflow-summary"
  | "board-columns-grid"
  | "backlog-new-task"
  | "backlog-overview"
  | "backlog-list";

export interface CoachmarkStep {
  targetId: CoachmarkTargetId;
  title: string;
  description: string;
}

interface UseBoardCoachmarksOptions {
  view: BoardWorkspaceView;
  hasWorkflowCards: boolean;
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
      title: "Switch Between Workspaces",
      description: "Board, List, Staging, and History stay one click away so you can move between planning and active work quickly.",
    },
    {
      targetId: "board-empty-state-cta",
      title: "Pull Work Out Of Staging",
      description: "No task has entered the workflow yet. Open Staging to create work or move a ready item into To Do.",
    },
  ],
  "board-active-sprint": [
    {
      targetId: "toolbar-view-switcher",
      title: "Keep Your Place Across Views",
      description: "Use these tabs to swap between the board, table view, staging, and task history without losing context.",
    },
    {
      targetId: "toolbar-search",
      title: "Search Only What You Need",
      description: "Search narrows the tasks in the current workspace so it is easier to focus on the work in front of you.",
    },
    {
      targetId: "workflow-summary",
      title: "Monitor The Flow",
      description: "This summary shows how much work is active, how much is done, and how much is still waiting in staging.",
    },
    {
      targetId: "board-columns-grid",
      title: "Move Tasks Through The Board",
      description: "Drag tasks between To Do, In Progress, In Review, and Done as work advances.",
    },
  ],
  "backlog-planning": [
    {
      targetId: "backlog-new-task",
      title: "Capture New Work",
      description: "Add ideas, requests, and upcoming tasks here so the team always has fresh work ready to stage.",
    },
    {
      targetId: "backlog-overview",
      title: "Stage A Batch In Queue",
      description: "This queue collects ready staging tasks so you can launch them into To Do together instead of one by one.",
    },
    {
      targetId: "backlog-list",
      title: "Choose What To Stage",
      description: "Use the card actions or drag-and-drop to add tasks into the queue, or pull them back out before starting the batch.",
    },
  ],
  "backlog-active-sprint": [
    {
      targetId: "backlog-overview",
      title: "Queue Up The Next Batch",
      description: "Even while work is active on the board, the queue helps you prepare the next set of staging tasks to release together.",
    },
    {
      targetId: "toolbar-view-switcher",
      title: "Jump Back To Active Work",
      description: "Board and List show the tasks already in motion, while Staging stays focused on what comes next.",
    },
    {
      targetId: "backlog-new-task",
      title: "Keep Feeding The Queue",
      description: "Continue adding future work here so the queue always has strong candidates when the team has capacity.",
    },
  ],
};

export function getCoachmarkFlowForView(
  view: BoardWorkspaceView,
  hasWorkflowCards: boolean,
): BoardCoachmarkFlowId | null {
  if (view === "board") {
    return hasWorkflowCards ? "board-active-sprint" : "board-no-active-sprint";
  }

  if (view === "backlog") {
    return hasWorkflowCards ? "backlog-active-sprint" : "backlog-planning";
  }

  return null;
}

function getCoachmarkElement(targetId: CoachmarkTargetId): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-coachmark="${targetId}"]`);
}

export function useBoardCoachmarks({
  view,
  hasWorkflowCards,
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

    const flowId = getCoachmarkFlowForView(view, hasWorkflowCards);
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
    hasFetchedPreferences,
    hasWorkflowCards,
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
