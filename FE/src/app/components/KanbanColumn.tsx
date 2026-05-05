import { KanbanCard } from "./KanbanCard";
import { useDrop } from "react-dnd";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Label } from "../utils/labels";
import { Card, Priority, TaskAssignee, TaskType } from "../utils/cards";
import { CustomScrollArea } from "./CustomScrollArea";
import { useEffect, useRef, useState } from "react";

type ColumnCard = Card & {
  priority?: Priority;
  taskType?: TaskType;
};

interface KanbanColumnProps {
  boardId: number;
  id: string;
  title: string;
  count: number;
  cards: ColumnCard[];
  onCardDrop: (cardId: number, fromColumnId: string, toColumnId: string, targetIndex?: number) => void;
  onOpen?: (cardId: number) => void;
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void;
  onDelete: (cardId: number, title: string) => void;
  onEdit?: (cardId: number) => void;
  onMoveToBacklog?: (cardId: number) => void;
  availableAssignees: TaskAssignee[];
  labels: Label[];
  softLimit?: number | null;
  hardLimit?: number | null;
}

type DraggedKanbanCard = {
  id: number;
  columnId: string;
};

type ColumnLimitState = "none" | "healthy" | "soft" | "hard";

const COLUMN_LIMIT_SEGMENT_GAP_REM = 0.375;

function getColumnLimitState(count: number, softLimit?: number | null, hardLimit?: number | null): ColumnLimitState {
  if (hardLimit != null && count >= hardLimit) {
    return "hard";
  }

  if (softLimit != null && count >= softLimit) {
    return "soft";
  }

  return softLimit == null && hardLimit == null ? "none" : "healthy";
}

function getColumnLimitDenominator(count: number, softLimit?: number | null, hardLimit?: number | null) {
  return hardLimit ?? softLimit ?? Math.max(count, 1);
}

function getColumnLimitSegmentCount(count: number, denominator: number, hasLimit: boolean) {
  if (!hasLimit) {
    return Math.max(count, 1);
  }

  return Math.max(1, denominator);
}

function getFilledLimitSegments(count: number, segmentCount: number) {
  if (count <= 0) {
    return 0;
  }

  return Math.min(segmentCount, count);
}

function getSoftLimitMarkerOffset(softLimit: number | null | undefined, segmentCount: number) {
  if (softLimit == null || softLimit >= segmentCount) {
    return null;
  }

  const totalGapWidth = (segmentCount - 1) * COLUMN_LIMIT_SEGMENT_GAP_REM;
  const gapCenterOffset = (softLimit - 0.5) * COLUMN_LIMIT_SEGMENT_GAP_REM;

  return `calc((100% - ${totalGapWidth}rem) * ${softLimit} / ${segmentCount} + ${gapCenterOffset}rem)`;
}

function getColumnLimitAriaLabel(
  title: string,
  count: number,
  state: ColumnLimitState,
  softLimit?: number | null,
  hardLimit?: number | null,
  isPreview = false,
) {
  const softLimitLabel = softLimit == null ? "not set" : softLimit;
  const hardLimitLabel = hardLimit == null ? "not set" : hardLimit;
  const stateLabel = state === "hard" ? "Hard limit reached" : state === "soft" ? "Soft limit reached" : "Within limits";
  const countLabel = isPreview ? `would have ${count} tasks` : `has ${count} tasks`;

  return `${isPreview ? "Preview: " : ""}${title} column ${countLabel}. Soft limit ${softLimitLabel}. Hard limit ${hardLimitLabel}. ${stateLabel}.`;
}

function getColumnLimitStatusMessage(state: ColumnLimitState) {
  if (state === "hard") {
    return "Column full. Move work forward.";
  }

  if (state === "soft") {
    return "Soft limit reached. Move work forward.";
  }

  return null;
}

export function KanbanColumn({ 
  boardId,
  id, 
  title, 
  count,
  cards, 
  onCardDrop,
  onOpen,
  onAssigneeChange,
  onDelete,
  onEdit,
  onMoveToBacklog,
  availableAssignees,
  labels,
  softLimit,
  hardLimit,
}: KanbanColumnProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const columnSurfaceClassName = isDarkMode ? "bg-zinc-950/52" : "bg-slate-50/88";
  const columnHeaderSurfaceClassName = isDarkMode ? "bg-zinc-900/46" : "bg-white/78";
  const hasColumnLimit = softLimit != null || hardLimit != null;
  const actualColumnLimitState = getColumnLimitState(count, softLimit, hardLimit);
  const isHardLimitReached = actualColumnLimitState === "hard";
  const headerBorderClassName = currentTheme.border;
  const limitBorderClassName = currentTheme.border;
  const [isBlockedDropFeedbackVisible, setIsBlockedDropFeedbackVisible] = useState(false);
  const blockedDropFeedbackTimeoutRef = useRef<number | null>(null);

  const showBlockedDropFeedback = () => {
    if (blockedDropFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(blockedDropFeedbackTimeoutRef.current);
    }

    setIsBlockedDropFeedbackVisible(true);
    blockedDropFeedbackTimeoutRef.current = window.setTimeout(() => {
      setIsBlockedDropFeedbackVisible(false);
      blockedDropFeedbackTimeoutRef.current = null;
    }, 420);
  };

  const [{ isOver, canDrop, draggedColumnId }, drop] = useDrop<DraggedKanbanCard, void, { isOver: boolean; canDrop: boolean; draggedColumnId: string | null }>({
    accept: "CARD",
    canDrop: () => true,
    drop: (item, monitor) => {
      if (monitor.didDrop()) {
        return;
      }

      if (item.columnId !== id && isHardLimitReached) {
        showBlockedDropFeedback();
        return;
      }

      onCardDrop(item.id, item.columnId, id, 0);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedColumnId: monitor.getItem()?.columnId ?? null,
    }),
  });
  const isDropPreviewActive = isOver && canDrop && draggedColumnId !== null && draggedColumnId !== id;
  const previewCount = isDropPreviewActive ? count + 1 : count;
  const columnLimitState = getColumnLimitState(previewCount, softLimit, hardLimit);
  const columnLimitDenominator = getColumnLimitDenominator(previewCount, softLimit, hardLimit);
  const columnLimitSegmentCount = getColumnLimitSegmentCount(previewCount, columnLimitDenominator, hasColumnLimit);
  const filledLimitSegments = getFilledLimitSegments(previewCount, columnLimitSegmentCount);
  const softLimitMarkerOffset = getSoftLimitMarkerOffset(softLimit, columnLimitSegmentCount);
  const columnLimitAriaLabel = getColumnLimitAriaLabel(title, previewCount, columnLimitState, softLimit, hardLimit, isDropPreviewActive);
  const columnLimitStatusMessage = getColumnLimitStatusMessage(actualColumnLimitState);
  const hasReachedSoftLimit = columnLimitState === "soft" || columnLimitState === "hard";
  const limitSegmentBaseClassName = isDarkMode ? "bg-zinc-800" : "bg-gray-200";
  const limitSegmentFillClassName =
    hasReachedSoftLimit
      ? currentTheme.primaryLimitSoftSolid
      : (isDarkMode ? "bg-zinc-500" : "bg-gray-400");
  const softLimitMarkerClassName = hasReachedSoftLimit
    ? currentTheme.primaryLimitSoftSolid
    : (isDarkMode ? "bg-zinc-200" : "bg-zinc-700");

  useEffect(() => {
    return () => {
      if (blockedDropFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(blockedDropFeedbackTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`w-full min-h-0 lg:h-full ${isBlockedDropFeedbackVisible ? "kanban-column-limit-shake" : ""}`}>
      <div
        ref={drop}
        className={`${columnSurfaceClassName} rounded-2xl border-2 transition-all flex min-h-[34rem] flex-col shadow-sm lg:h-full lg:min-h-0 ${
          isOver && canDrop ? `${currentTheme.primaryBorder} ring-4 ${currentTheme.ring} scale-[1.01]` : limitBorderClassName
        } ${isBlockedDropFeedbackVisible ? "kanban-column-limit-pulse" : ""}`}
      >
        {/* Column Header */}
        <div className={`rounded-t-2xl border-b-2 py-4 ${headerBorderClassName} ${columnHeaderSurfaceClassName}`}>
          <div className="flex w-full flex-col items-center gap-2 text-center">
            <h2 className={`font-kanban-column-title w-full min-w-0 truncate px-5 pb-0.5 text-[1.08rem] font-bold leading-[1.35] tracking-[-0.015em] ${currentTheme.text}`}>
              {title}
            </h2>
            <div
              className="relative w-[76%] min-w-32 max-w-56"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={columnLimitDenominator}
              aria-valuenow={Math.min(previewCount, columnLimitDenominator)}
              aria-valuetext={columnLimitAriaLabel}
              aria-label={columnLimitAriaLabel}
              title={columnLimitAriaLabel}
            >
              {softLimitMarkerOffset ? (
                <span
                  className={`absolute top-1/2 z-10 h-2 w-px -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 ease-out ${softLimitMarkerClassName}`}
                  style={{ left: softLimitMarkerOffset }}
                  aria-hidden="true"
                />
              ) : null}
              <div className="flex w-full gap-1.5">
                {Array.from({ length: columnLimitSegmentCount }).map((_, index) => {
                  const isFilled = index < filledLimitSegments;

                  return (
                    <span
                      key={index}
                      className={`h-[3px] min-w-0 flex-1 rounded-[1px] transition-colors duration-300 ease-out ${
                        isFilled ? limitSegmentFillClassName : limitSegmentBaseClassName
                      }`}
                      aria-hidden="true"
                    />
                  );
                })}
              </div>
            </div>
            <p
              className={`font-kanban-limit-message min-h-[12px] w-[90%] max-w-72 overflow-hidden text-ellipsis whitespace-nowrap px-2 text-[9px] font-semibold leading-[1.25] tracking-[-0.04em] ${currentTheme.primaryText} ${
                columnLimitStatusMessage ? "" : "invisible"
              }`}
              title={columnLimitStatusMessage ?? undefined}
              aria-hidden={columnLimitStatusMessage ? undefined : "true"}
            >
              {columnLimitStatusMessage ?? "\u00a0"}
            </p>
          </div>
        </div>
        
        {/* Cards Container */}
        <CustomScrollArea
          className="flex-1 min-h-0"
          viewportClassName="h-full min-h-0 px-4 py-4"
        >
          {cards.length > 0 ? (
            <div className="space-y-3">
              {cards.map((card, index) => (
                <KanbanCard
                  key={card.id}
                  boardId={boardId}
                  id={card.id}
                  index={index}
                  title={card.title}
                  labelIds={card.labelIds}
                  assignee={card.assignee}
                  columnId={id}
                  onCardDrop={onCardDrop}
                  onOpen={onOpen}
                  onAssigneeChange={onAssigneeChange}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onMoveToBacklog={onMoveToBacklog}
                  availableAssignees={availableAssignees}
                  labels={labels}
                  storyPoints={card.storyPoints}
                  dueDate={card.dueDate}
                  statusEnteredAtUtc={card.statusEnteredAtUtc}
                  priority={card.priority}
                  taskType={card.taskType}
                  showColumnAge
                />
              ))}
            </div>
          ) : (
            <div className={`flex min-h-[14rem] flex-col items-center justify-center text-center ${currentTheme.textMuted}`}>
              <p className="text-sm">No tasks</p>
            </div>
          )}
        </CustomScrollArea>
      </div>
    </div>
  );
}
