import { useCallback, useEffect, useMemo, useState } from "react";
import { CoachmarkFlowId } from "../utils/userPreferences";

export type BoardWorkspaceView = "board" | "list" | "staging" | "backlog" | "history" | "statistics";
export type BoardCoachmarkView = BoardWorkspaceView | "boardSettings";
type BoardCoachmarkFlowId =
  | "board-no-active-sprint"
  | "board-active-sprint"
  | "list-no-active-sprint"
  | "list-active-sprint"
  | "staging-planning"
  | "staging-active-sprint"
  | "backlog-overview"
  | "history-overview"
  | "board-statistics-overview"
  | "board-settings-overview";

export type CoachmarkTargetId =
  | "board-header"
  | "board-sidebar-actions"
  | "toolbar-view-switcher"
  | "board-columns-grid"
  | "list-header"
  | "list-filters"
  | "list-table"
  | "staging-new-task"
  | "staging-overview"
  | "staging-list"
  | "backlog-header"
  | "backlog-filters"
  | "backlog-table"
  | "history-header"
  | "history-list"
  | "statistics-header"
  | "statistics-summary"
  | "statistics-status-charts"
  | "statistics-aging-watchlist"
  | "statistics-conclusion-history"
  | "board-settings-header"
  | "board-settings-identity"
  | "board-settings-columns"
  | "board-settings-members"
  | "board-settings-actions";

export interface CoachmarkStep {
  targetId: CoachmarkTargetId;
  title: string;
  description: string;
}

interface UseBoardCoachmarksOptions {
  view: BoardCoachmarkView;
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
      targetId: "board-header",
      title: "Board View",
      description: "This tab is the live workflow surface where tasks move through the board columns.",
    },
    {
      targetId: "toolbar-view-switcher",
      title: "Switch Between Workspaces",
      description: "Use the workspace tabs to move between Board, List, Staging, Backlog, History, and Statistics without leaving this board.",
    },
    {
      targetId: "board-sidebar-actions",
      title: "Create Work And Manage Labels",
      description: "The sidebar keeps task creation, board labels, leaderboard context, and board settings within reach.",
    },
    {
      targetId: "board-columns-grid",
      title: "Workflow Columns",
      description: "The columns stay visible even before active work starts, so you can see exactly where staged tasks will land.",
    },
  ],
  "board-active-sprint": [
    {
      targetId: "board-header",
      title: "Board View",
      description: "Use this tab when you want the clearest picture of active work moving through the workflow.",
    },
    {
      targetId: "board-sidebar-actions",
      title: "Create Work And Manage Labels",
      description: "Use the sidebar to add tasks, manage labels, check leaderboard context, or open board settings when you have access.",
    },
    {
      targetId: "toolbar-view-switcher",
      title: "Keep Your Place Across Views",
      description: "These tabs keep Board, List, Staging, Backlog, History, and Statistics one click away.",
    },
    {
      targetId: "board-columns-grid",
      title: "Move Tasks Through The Board",
      description: "Drag tasks between To Do, In Progress, In Review, and Done as work advances, then conclude Done work when it is ready for History.",
    },
  ],
  "list-no-active-sprint": [
    {
      targetId: "list-header",
      title: "List Is Ready When Work Starts",
      description: "The list tab stays available before active work begins, so you can preview the active-task index layout.",
    },
    {
      targetId: "list-filters",
      title: "Filters Stay Ready Too",
      description: "Search, quick filters, priority, task type, assignee, and labels are ready as soon as tasks enter the workflow.",
    },
    {
      targetId: "list-table",
      title: "The Table Will Fill Here",
      description: "Once work leaves Staging, this table shows active tasks with sortable metadata and task actions.",
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
      description: "Search, quick filters, priority, task type, assignee, and labels help you find the exact tasks that need attention.",
    },
    {
      targetId: "list-table",
      title: "Review The Details",
      description: "The table keeps priority, labels, assignee, due dates, status, story points, and actions in one place for quick triage.",
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
      description: "The queue collects ready staging tasks so you can launch them into To Do together and create planning poker sessions for unestimated work.",
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
      description: "Even while work is active on the board, the queue prepares the next batch and keeps planning poker close to the work being estimated.",
    },
    {
      targetId: "toolbar-view-switcher",
      title: "Jump Back To Active Work",
      description: "Board and List show tasks already in motion, while Staging stays focused on what comes next.",
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
      description: "Backlog focuses on waiting and queued work without mixing it into the live board workflow.",
    },
    {
      targetId: "backlog-filters",
      title: "Refine What Is Ready",
      description: "Use search, quick filters, queue state, priority, task type, assignee, and labels to narrow upcoming work.",
    },
    {
      targetId: "backlog-table",
      title: "See Queue Status Clearly",
      description: "The backlog table keeps readiness, labels, assignee, metadata, and queue actions together so grooming stays quick.",
    },
  ],
  "history-overview": [
    {
      targetId: "history-header",
      title: "Review Completed Work",
      description: "History gives you a dedicated place to inspect concluded tasks and restore anything that needs another pass.",
    },
    {
      targetId: "history-list",
      title: "Browse The Completed Timeline",
      description: "The concluded-task table keeps restored-task actions and completed work context away from active workflow views.",
    },
  ],
  "board-statistics-overview": [
    {
      targetId: "statistics-header",
      title: "Board Health",
      description: "Statistics summarizes board health, aging work, priority mix, and concluded task movement.",
    },
    {
      targetId: "statistics-summary",
      title: "Top Metrics",
      description: "These metrics show active board volume, backlog volume, and how long work has been sitting in its current status.",
    },
    {
      targetId: "statistics-status-charts",
      title: "Status And Readiness",
      description: "The charts split active workflow tasks, backlog readiness, and priority distribution into quick visual checks.",
    },
    {
      targetId: "statistics-aging-watchlist",
      title: "Aging Watchlist",
      description: "This panel surfaces tasks that have stayed in the same status long enough to deserve attention.",
    },
    {
      targetId: "statistics-conclusion-history",
      title: "Conclusion History",
      description: "Use this trend to compare concluded work against remaining unconcluded work over the selected period.",
    },
  ],
  "board-settings-overview": [
    {
      targetId: "board-settings-header",
      title: "Board Settings",
      description: "Settings lets board owners adjust identity, workflow limits, and team access from inside the workspace.",
    },
    {
      targetId: "board-settings-identity",
      title: "Board Identity",
      description: "Update the board name, description, icon, and accent color that appear across navigation and task context.",
    },
    {
      targetId: "board-settings-columns",
      title: "Column Limits",
      description: "Set soft and hard work-in-progress thresholds for each active workflow column.",
    },
    {
      targetId: "board-settings-members",
      title: "Team Access",
      description: "Add collaborators, review the member count, and remove people who no longer need access.",
    },
    {
      targetId: "board-settings-actions",
      title: "Save Or Reset",
      description: "Use the bottom actions to reset unsaved edits or save all valid board setting changes together.",
    },
  ],
};

export function getCoachmarkFlowForView(
  view: BoardCoachmarkView,
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

  if (view === "statistics") {
    return "board-statistics-overview";
  }

  if (view === "boardSettings") {
    return "board-settings-overview";
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
