import { useCallback, useEffect, useMemo, useState } from "react";
import { CoachmarkFlowId } from "../utils/userPreferences";

export type BoardWorkspaceView = "board" | "list" | "staging" | "backlog" | "history";
type BoardCoachmarkFlowId =
  | "board-no-active-sprint"
  | "board-active-sprint"
  | "list-no-active-sprint"
  | "list-active-sprint"
  | "staging-planning"
  | "staging-active-sprint"
  | "backlog-overview"
  | "history-overview";

export type CoachmarkTargetId =
  | "board-sidebar-actions"
  | "toolbar-view-switcher"
  | "board-empty-state-cta"
  | "board-columns-grid"
  | "list-header"
  | "list-filters"
  | "list-table"
  | "list-empty-state-cta"
  | "staging-new-task"
  | "staging-overview"
  | "staging-list"
  | "backlog-header"
  | "backlog-filters"
  | "backlog-table"
  | "history-header"
  | "history-list";

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
      targetId: "board-sidebar-actions",
      title: "Create Work And Manage Labels",
      description: "The board sidebar keeps task creation, board labels, and quick workspace actions within reach while you work.",
    },
    {
      targetId: "toolbar-view-switcher",
      title: "Switch Between Workspaces",
      description: "Board, List, Staging, and History stay one click away so you can move between planning and active work quickly.",
    },
    {
      targetId: "board-columns-grid",
      title: "The Workflow Is Ready",
      description: "These columns stay visible even before work starts, so you can see exactly where tasks will land once they leave Staging.",
    },
    {
      targetId: "board-empty-state-cta",
      title: "Pull Work Out Of Staging",
      description: "No task has entered the workflow yet. Open Staging to create work or move a ready item into To Do.",
    },
  ],
  "board-active-sprint": [
    {
      targetId: "board-sidebar-actions",
      title: "Create Work And Manage Labels",
      description: "Use the sidebar to add new tasks, manage board labels, and keep key board actions close by.",
    },
    {
      targetId: "toolbar-view-switcher",
      title: "Keep Your Place Across Views",
      description: "Use these tabs to swap between the board, list, staging, backlog, and task history without losing context.",
    },
    {
      targetId: "board-columns-grid",
      title: "Move Tasks Through The Board",
      description: "Drag tasks between To Do, In Progress, In Review, and Done as work advances.",
    },
  ],
  "list-no-active-sprint": [
    {
      targetId: "list-header",
      title: "List Is Ready When Work Starts",
      description: "The list tab stays available even before active work begins, so you can understand the layout before tasks appear.",
    },
    {
      targetId: "list-filters",
      title: "Filters Stay Ready Too",
      description: "Search, quick filters, and labels stay in place so you can narrow the list as soon as tasks enter the workflow.",
    },
    {
      targetId: "list-table",
      title: "The Table Will Fill Here",
      description: "Once work leaves Staging, this table will show the full active task index in one place.",
    },
    {
      targetId: "list-empty-state-cta",
      title: "Fill The List From Staging",
      description: "There are no active tasks yet. Open Staging and move a ready item into the workflow to populate this view.",
    },
  ],
  "list-active-sprint": [
    {
      targetId: "list-header",
      title: "Scan Active Work Fast",
      description: "The list tab shows every task already in motion, so you can review the workflow without switching columns.",
    },
    {
      targetId: "list-filters",
      title: "Narrow The Active List",
      description: "Search, quick filters, and labels help you focus on the exact tasks that need attention right now.",
    },
    {
      targetId: "list-table",
      title: "Review The Details",
      description: "This table keeps priority, labels, assignee, and actions in one place for quick triage.",
    },
  ],
  "staging-planning": [
    {
      targetId: "staging-new-task",
      title: "Capture New Work",
      description: "Add ideas, requests, and upcoming tasks here so the team always has fresh work ready to stage.",
    },
    {
      targetId: "staging-overview",
      title: "Stage A Batch In Queue",
      description: "This queue collects ready staging tasks so you can launch them into To Do together instead of one by one.",
    },
    {
      targetId: "staging-list",
      title: "Choose What To Stage",
      description: "Use the card actions or drag-and-drop to add tasks into the queue, or pull them back out before starting the batch.",
    },
  ],
  "staging-active-sprint": [
    {
      targetId: "staging-overview",
      title: "Queue Up The Next Batch",
      description: "Even while work is active on the board, the queue helps you prepare the next set of staging tasks to release together.",
    },
    {
      targetId: "toolbar-view-switcher",
      title: "Jump Back To Active Work",
      description: "Board and List show the tasks already in motion, while Staging stays focused on what comes next.",
    },
    {
      targetId: "staging-new-task",
      title: "Keep Feeding The Queue",
      description: "Continue adding future work here so the queue always has strong candidates when the team has capacity.",
    },
  ],
  "backlog-overview": [
    {
      targetId: "backlog-header",
      title: "Keep Backlog Separate From Active Work",
      description: "This tab is focused on tasks still in backlog, so waiting and queued work stay visible without mixing into the live workflow.",
    },
    {
      targetId: "backlog-filters",
      title: "Refine What Is Ready",
      description: "Use search, readiness, and label filters to narrow backlog work before you queue the next batch.",
    },
    {
      targetId: "backlog-table",
      title: "See Queue Status Clearly",
      description: "The backlog table keeps readiness, labels, assignee, and queue actions together so grooming stays quick.",
    },
  ],
  "history-overview": [
    {
      targetId: "history-header",
      title: "Review Completed Work",
      description: "History gives you a dedicated place to inspect finished tasks and understand what has already moved through the board.",
    },
    {
      targetId: "history-list",
      title: "Browse The Completed Timeline",
      description: "Completed tasks stay grouped here so you can revisit earlier work without disturbing the active workflow.",
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

  if (view === "list") {
    return hasWorkflowCards ? "list-active-sprint" : "list-no-active-sprint";
  }

  if (view === "staging") {
    return hasWorkflowCards ? "staging-active-sprint" : "staging-planning";
  }

  if (view === "backlog") {
    return "backlog-overview";
  }

  if (view === "history") {
    return "history-overview";
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
  const [dismissedFlowId, setDismissedFlowId] = useState<BoardCoachmarkFlowId | null>(null);

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
      setDismissedFlowId(activeFlowId);
    }

    if (activeFlowId && markCompleted) {
      onFlowCompleted(activeFlowId);
    }

    setActiveFlowId(null);
    setStepIndex(0);
    setTargetRect(null);
  }, [activeFlowId, onFlowCompleted]);

  const startFlow = useCallback((flowId: BoardCoachmarkFlowId) => {
    setDismissedFlowId(null);
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
    if (!flowId || completedFlows.includes(flowId) || dismissedFlowId === flowId) {
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
    dismissedFlowId,
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
