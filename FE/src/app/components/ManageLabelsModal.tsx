import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, HelpCircle, Plus, RotateCcw, Tag, Trash2 } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { FormModalFrame } from "./FormModalFrame";
import { getInputLikeControlClassName } from "./inputLikeControlStyles";
import { OverflowTooltip } from "./OverflowTooltip";
import { UtilityIconButton } from "./UtilityIconButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  getPrimaryModalActionButtonClassName,
  getSecondaryModalActionButtonClassName,
} from "./modalActionButtonStyles";
import {
  DEFAULT_LABEL_COLOR,
  LABEL_COLORS,
  Label,
  LabelDraft,
  LABEL_NAME_CHARACTER_MESSAGE,
  isValidLabelNameCharacters,
  MAX_BOARD_LABELS,
  MAX_LABEL_NAME_LENGTH,
  normalizeLabelName,
  sortLabelsByName,
} from "../utils/labels";

interface ManageLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: Label[];
  onSave: (drafts: LabelDraft[]) => Promise<void>;
}

function createDraftFromLabel(label: Label): LabelDraft {
  return {
    tempId: `label-${label.id}`,
    id: label.id,
    name: label.name,
    color: label.color,
  };
}

export function ManageLabelsModal({
  isOpen,
  onClose,
  labels,
  onSave,
}: ManageLabelsModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const modalFieldSurfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-gray-50";
  const modalSecondarySurfaceClassName = isDarkMode ? currentTheme.bgSecondary : "bg-gray-50";
  const primaryActionButtonClassName = getPrimaryModalActionButtonClassName(currentTheme);
  const secondaryActionButtonClassName = getSecondaryModalActionButtonClassName(
    currentTheme,
    currentTheme.textSecondary,
  );
  const addLabelButtonClassName = `group/add-label relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r px-4 py-2.5 font-bold text-white shadow-lg transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-lg ${currentTheme.focus} ${currentTheme.primary}`;
  const labelPreviewChipClassName = "inline-flex h-6 min-w-0 max-w-[11rem] items-center rounded-md px-2 text-xs font-medium leading-none text-white";
  const sectionTitleClassName = `text-lg font-semibold ${currentTheme.text}`;
  const sectionDescriptionClassName = `text-sm ${currentTheme.textMuted}`;
  const subtleUtilityButtonClassName = `w-auto gap-1.5 px-2.5 text-xs font-semibold shadow-none border-transparent bg-transparent ${currentTheme.textSecondary}`;
  const sectionDividerClassName = isDarkMode
    ? "h-px rounded-full bg-zinc-800"
    : "h-px rounded-full bg-gray-200";
  const helpIconButtonClassName = `inline-flex h-5 w-5 items-center justify-center rounded-full ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;
  const selectedColorChipClasses = `border-transparent ring-2 ${currentTheme.ring} ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 shadow-sm scale-105`;

  const [drafts, setDrafts] = useState<LabelDraft[]>([]);
  const [collapsedDraftIds, setCollapsedDraftIds] = useState<Set<string>>(new Set());
  const [touchedDraftIds, setTouchedDraftIds] = useState<Set<string>>(new Set());
  const [hasTriedSave, setHasTriedSave] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingRevealTempId, setPendingRevealTempId] = useState<string | null>(null);
  const nextTempIdRef = useRef(0);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const nameInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const createDraftTempId = () => {
    nextTempIdRef.current += 1;
    return `draft-${nextTempIdRef.current}`;
  };

  useEffect(() => {
    if (!isOpen) {
      setDrafts([]);
      setCollapsedDraftIds(new Set());
      setTouchedDraftIds(new Set());
      setHasTriedSave(false);
      setSaveError("");
      setIsSaving(false);
      setPendingRevealTempId(null);
      return;
    }

    nextTempIdRef.current = 0;
    setDrafts(sortLabelsByName(labels).map(createDraftFromLabel));
    setCollapsedDraftIds(new Set());
    setTouchedDraftIds(new Set());
    setHasTriedSave(false);
    setSaveError("");
    setIsSaving(false);
    setPendingRevealTempId(null);
  }, [isOpen, labels]);

  useEffect(() => {
    if (!pendingRevealTempId) {
      return;
    }

    const targetRow = rowRefs.current[pendingRevealTempId];
    if (!targetRow) {
      return;
    }

    let focusFrameId = 0;
    const scrollFrameId = window.requestAnimationFrame(() => {
      targetRow.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });

      focusFrameId = window.requestAnimationFrame(() => {
        const input = nameInputRefs.current[pendingRevealTempId];
        if (input) {
          input.focus();
          input.select();
        }

        setPendingRevealTempId(null);
      });
    });

    return () => {
      window.cancelAnimationFrame(scrollFrameId);
      if (focusFrameId) {
        window.cancelAnimationFrame(focusFrameId);
      }
    };
  }, [drafts, pendingRevealTempId]);

  const activeDrafts = useMemo(
    () => drafts.filter((draft) => !draft.isDeleted),
    [drafts],
  );
  const activeLabelCount = activeDrafts.length;
  const persistedLabelCount = labels.length;
  const originalLabelsById = useMemo(
    () => new Map(labels.map((label) => [label.id, label])),
    [labels],
  );
  const modifiedCount = useMemo(
    () => drafts.filter((draft) => {
      if (draft.isDeleted || typeof draft.id !== "number") {
        return false;
      }

      const originalLabel = originalLabelsById.get(draft.id);
      if (!originalLabel) {
        return false;
      }

      return draft.name.trim() !== originalLabel.name || draft.color !== originalLabel.color;
    }).length,
    [drafts, originalLabelsById],
  );
  const addedCount = useMemo(
    () => drafts.filter((draft) => draft.isNew).length,
    [drafts],
  );
  const deletedCount = useMemo(
    () => drafts.filter((draft) => draft.isDeleted && typeof draft.id === "number").length,
    [drafts],
  );
  const inactiveStatClassName = currentTheme.textMuted;
  const modifiedStatClassName = modifiedCount > 0
    ? currentTheme.primaryText
    : inactiveStatClassName;
  const addedStatClassName = addedCount > 0
    ? currentTheme.primaryText
    : inactiveStatClassName;
  const deletedStatClassName = deletedCount > 0
    ? currentTheme.primaryText
    : inactiveStatClassName;
  const rowErrors = useMemo(() => {
    const errorMap: Record<string, string> = {};
    const normalizedCounts = new Map<string, number>();

    activeDrafts.forEach((draft) => {
      const trimmedName = draft.name.trim();
      if (!trimmedName) {
        return;
      }

      const normalizedName = normalizeLabelName(trimmedName);
      normalizedCounts.set(normalizedName, (normalizedCounts.get(normalizedName) ?? 0) + 1);
    });

    activeDrafts.forEach((draft) => {
      const trimmedName = draft.name.trim();

      if (!trimmedName) {
        errorMap[draft.tempId] = "Label name is required.";
        return;
      }

      if (!isValidLabelNameCharacters(trimmedName)) {
        errorMap[draft.tempId] = LABEL_NAME_CHARACTER_MESSAGE;
        return;
      }

      if (trimmedName.length > MAX_LABEL_NAME_LENGTH) {
        errorMap[draft.tempId] = `Label names can be up to ${MAX_LABEL_NAME_LENGTH} characters.`;
        return;
      }

      const normalizedName = normalizeLabelName(trimmedName);
      if ((normalizedCounts.get(normalizedName) ?? 0) > 1) {
        errorMap[draft.tempId] = "A label with this name already exists in this draft.";
      }
    });

    return errorMap;
  }, [activeDrafts]);

  const editableDraftIds = useMemo(
    () => drafts.filter((draft) => !draft.isDeleted).map((draft) => draft.tempId),
    [drafts],
  );
  const collapsibleDraftIds = useMemo(
    () => editableDraftIds.filter((tempId) => !rowErrors[tempId]),
    [editableDraftIds, rowErrors],
  );
  const allEditableRowsCollapsed = collapsibleDraftIds.length > 0
    && collapsibleDraftIds.every((tempId) => collapsedDraftIds.has(tempId));
  const issueCount = Object.keys(rowErrors).filter(
    (tempId) => hasTriedSave || touchedDraftIds.has(tempId),
  ).length;

  useEffect(() => {
    const invalidCollapsedIds = Object.keys(rowErrors).filter((tempId) => collapsedDraftIds.has(tempId));
    if (invalidCollapsedIds.length === 0) {
      return;
    }

    setCollapsedDraftIds((currentIds) => {
      const nextIds = new Set(currentIds);
      invalidCollapsedIds.forEach((tempId) => {
        nextIds.delete(tempId);
      });
      return nextIds;
    });
  }, [collapsedDraftIds, rowErrors]);

  const hasValidationErrors = activeLabelCount > MAX_BOARD_LABELS || Object.keys(rowErrors).length > 0;
  const canAddLabel = activeLabelCount < MAX_BOARD_LABELS;
  const canSave = !hasValidationErrors;

  const getDraftStatusCode = (draft: LabelDraft) => {
    if (draft.isDeleted && typeof draft.id === "number") {
      return "D";
    }

    if (draft.isNew) {
      return "A";
    }

    if (typeof draft.id === "number") {
      const originalLabel = originalLabelsById.get(draft.id);
      if (originalLabel && (draft.name.trim() !== originalLabel.name || draft.color !== originalLabel.color)) {
        return "M";
      }
    }

    return null;
  };

  const getDraftStatusLabel = (draft: LabelDraft) => {
    const draftStatusCode = getDraftStatusCode(draft);

    if (draftStatusCode === "M") {
      return "Modified";
    }

    if (draftStatusCode === "A") {
      return "Added";
    }

    if (draftStatusCode === "D") {
      return "Deleted";
    }

    return null;
  };

  const updateDraft = (tempId: string, updates: Partial<LabelDraft>) => {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.tempId === tempId
          ? {
              ...draft,
              ...updates,
            }
          : draft,
      ),
    );
    setSaveError("");
  };

  const markDraftTouched = (tempId: string) => {
    setTouchedDraftIds((currentIds) => {
      if (currentIds.has(tempId)) {
        return currentIds;
      }

      const nextIds = new Set(currentIds);
      nextIds.add(tempId);
      return nextIds;
    });
  };

  const handleAddLabel = () => {
    if (!canAddLabel) {
      return;
    }

    const tempId = createDraftTempId();

    setDrafts((currentDrafts) => [
      ...currentDrafts,
      {
        tempId,
        name: "",
        color: DEFAULT_LABEL_COLOR,
        isNew: true,
      },
    ]);
    setPendingRevealTempId(tempId);
    setSaveError("");
  };

  const handleDeleteDraft = (draft: LabelDraft) => {
    setSaveError("");

    if (typeof draft.id !== "number") {
      setDrafts((currentDrafts) => currentDrafts.filter((item) => item.tempId !== draft.tempId));
      return;
    }

    updateDraft(draft.tempId, { isDeleted: true });
  };

  const handleRestoreDraft = (tempId: string) => {
    updateDraft(tempId, { isDeleted: false });
  };

  const handleResetDraftChanges = (draft: LabelDraft) => {
    if (typeof draft.id !== "number") {
      return;
    }

    const originalLabel = originalLabelsById.get(draft.id);
    if (!originalLabel) {
      return;
    }

    updateDraft(draft.tempId, {
      name: originalLabel.name,
      color: originalLabel.color,
      isDeleted: false,
    });
  };

  const toggleDraftCollapsed = (tempId: string) => {
    setCollapsedDraftIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(tempId)) {
        nextIds.delete(tempId);
      } else {
        nextIds.add(tempId);
      }

      return nextIds;
    });
  };

  const toggleAllEditableRows = () => {
    if (collapsibleDraftIds.length === 0) {
      return;
    }

    setCollapsedDraftIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (allEditableRowsCollapsed) {
        collapsibleDraftIds.forEach((tempId) => {
          nextIds.delete(tempId);
        });
      } else {
        collapsibleDraftIds.forEach((tempId) => {
          nextIds.add(tempId);
        });
      }

      return nextIds;
    });
  };

  const focusDraftRow = (tempId: string) => {
    const targetRow = rowRefs.current[tempId];
    if (targetRow) {
      targetRow.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }

    window.requestAnimationFrame(() => {
      const input = nameInputRefs.current[tempId];
      if (input) {
        input.focus();
        input.select();
      }
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setHasTriedSave(true);
    setSaveError("");

    if (!canSave) {
      const firstInvalidDraft = activeDrafts.find((draft) => rowErrors[draft.tempId]);
      if (firstInvalidDraft) {
        focusDraftRow(firstInvalidDraft.tempId);
      }
      return;
    }

    try {
      setIsSaving(true);
      await onSave(drafts.map((draft) => ({
        ...draft,
        name: draft.name.trim(),
      })));
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save label changes right now.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <FormModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Labels"
      closeAriaLabel="Close labels modal"
      onSubmit={handleSave}
      maxWidthClassName="max-w-3xl"
      height="min(90vh, 54rem)"
      viewportClassName="h-full min-h-0 pr-4"
      contentClassName="flex h-full min-h-0 flex-col px-1 py-1"
      footer={(
        <>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 px-5 py-3 font-semibold ${secondaryActionButtonClassName}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`flex-1 px-5 py-3 font-semibold ${primaryActionButtonClassName}`}
          >
            {isSaving ? "Saving..." : "Save Labels"}
          </button>
        </>
      )}
    >
      <section className="flex h-full min-h-0 flex-col gap-5" aria-labelledby="manage-label-list-heading">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Tag className={`h-4 w-4 shrink-0 ${currentTheme.primaryText}`} />
              <h3 id="manage-label-list-heading" className={sectionTitleClassName}>
                Manage label list
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={helpIconButtonClassName}
                    aria-label="Label management help"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  Rename labels, change colors, add new ones, or mark existing labels for deletion before saving.
                </TooltipContent>
              </Tooltip>
              <span className={`text-xs font-medium ${currentTheme.primaryText}`}>
                ({persistedLabelCount} existing label{persistedLabelCount !== 1 ? "s" : ""})
              </span>
            </div>
          </div>

          <p className={sectionDescriptionClassName}>
            Using {activeLabelCount} of {MAX_BOARD_LABELS} available labels in this draft. Deleted labels will be unattached from tasks when you save.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-status-condensed flex flex-wrap items-center gap-4 text-[0.9rem] font-bold uppercase tracking-[0.08em] leading-none">
                  <span className={modifiedStatClassName}>M {modifiedCount}</span>
                  <span className={addedStatClassName}>A {addedCount}</span>
                  <span className={deletedStatClassName}>D {deletedCount}</span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={helpIconButtonClassName}
                      aria-label="Draft status statistics help"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    M shows edited existing labels, A shows newly added labels, and D shows labels marked for deletion on save.
                  </TooltipContent>
                </Tooltip>
              </div>

              {issueCount > 0 ? (
                <span className={`text-xs font-semibold leading-none ${currentTheme.primaryText}`}>
                  ({issueCount} {issueCount === 1 ? "requires" : "require"} attention)
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleAddLabel}
              disabled={!canAddLabel}
              className={addLabelButtonClassName}
            >
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.24)_50%,transparent_85%)] opacity-0 transition-opacity duration-300 group-hover/add-label:opacity-100" />
              <span className="relative z-10 inline-flex items-center gap-2 leading-none">
                <Plus className="h-4.5 w-4.5 will-change-transform transition-transform duration-200 group-hover/add-label:rotate-90 group-hover/add-label:scale-110" />
                <span className="leading-none">Add Label</span>
              </span>
            </button>
          </div>

          <div className="pt-2" aria-hidden="true">
            <div className={sectionDividerClassName} />
          </div>

          <div className="flex justify-end pt-1">
            <UtilityIconButton
              type="button"
              size="sm"
              emphasis="elevated"
              onClick={toggleAllEditableRows}
              disabled={collapsibleDraftIds.length === 0}
              className={subtleUtilityButtonClassName}
              aria-label={allEditableRowsCollapsed ? "Expand all labels" : "Collapse all labels"}
            >
              {allEditableRowsCollapsed ? "Expand all" : "Collapse all"}
            </UtilityIconButton>
          </div>
        </div>

        {activeLabelCount > MAX_BOARD_LABELS ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            This draft has more than {MAX_BOARD_LABELS} active labels. Remove or delete a label before saving.
          </div>
        ) : null}

        {saveError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col space-y-3">
          {drafts.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-8 text-center">
              <p className={`text-base font-semibold ${currentTheme.text}`}>No labels yet</p>
              <p className={`mt-2 max-w-md text-sm ${currentTheme.textMuted}`}>
                Add the first label to start grouping tasks by topic, workflow, or responsibility.
              </p>
            </div>
          ) : (
            drafts.map((draft) => {
              const isDeleted = Boolean(draft.isDeleted);
              const isCollapsed = collapsedDraftIds.has(draft.tempId);
              const rowError = rowErrors[draft.tempId];
              const displayRowError = hasTriedSave || touchedDraftIds.has(draft.tempId) ? rowError : "";
              const trimmedNameLength = draft.name.trim().length;
              const showEditableFields = !isDeleted && !isCollapsed;
              const draftStatusCode = getDraftStatusCode(draft);
              const draftStatusLabel = getDraftStatusLabel(draft);
              const draftStatusClassName = draftStatusCode === "M"
                ? modifiedStatClassName
                : draftStatusCode === "A"
                  ? addedStatClassName
                  : draftStatusCode === "D"
                    ? deletedStatClassName
                    : inactiveStatClassName;

              return (
                <div
                  key={draft.tempId}
                  ref={(element) => {
                    rowRefs.current[draft.tempId] = element;
                  }}
                  className={`rounded-2xl border p-4 ${currentTheme.border} ${modalSecondarySurfaceClassName}`}
                >
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="min-w-0 flex flex-1 items-center">
                      <div className="flex min-w-0 items-center gap-2">
                        <OverflowTooltip
                          text={draft.name.trim() || "Untitled label"}
                          className={`${labelPreviewChipClassName} ${isDeleted ? "opacity-70" : ""}`}
                          style={{ backgroundColor: draft.color }}
                        />
                        {draftStatusLabel ? (
                          <span className={`shrink-0 text-[11px] font-medium leading-none ${draftStatusClassName}`}>
                            {draftStatusLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isDeleted ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <UtilityIconButton
                            type="button"
                            size="sm"
                              disabled={Boolean(rowError)}
                              onClick={() => toggleDraftCollapsed(draft.tempId)}
                              aria-label={isCollapsed ? "Expand label details" : "Collapse label details"}
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : "rotate-0"}`} />
                            </UtilityIconButton>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            {rowError ? "Fix row issues before collapsing" : isCollapsed ? "Expand details" : "Collapse details"}
                          </TooltipContent>
                        </Tooltip>
                      ) : null}

                      {isDeleted ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <UtilityIconButton
                              type="button"
                              size="sm"
                              onClick={() => handleRestoreDraft(draft.tempId)}
                              aria-label="Undo label deletion"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </UtilityIconButton>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>Undo deletion</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <UtilityIconButton
                              type="button"
                              size="sm"
                              onClick={() => handleDeleteDraft(draft)}
                              aria-label={draft.id ? "Delete label" : "Remove new label"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </UtilityIconButton>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            {draft.id ? "Delete label after save" : "Remove draft label"}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {draftStatusCode === "M" && !isDeleted ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <UtilityIconButton
                              type="button"
                              size="sm"
                              onClick={() => handleResetDraftChanges(draft)}
                              aria-label="Reset label changes"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </UtilityIconButton>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>Reset changes</TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                  </div>
                  {showEditableFields ? (
                    <>
                      <div className="mt-4">
                        <div className="mb-2 flex min-w-0 items-center gap-2">
                          <label htmlFor={`label-name-${draft.tempId}`} className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
                            Label Name <span className="text-red-500">*</span>
                          </label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={helpIconButtonClassName}
                                aria-label="Label name help"
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>
                              Label names can contain only letters and spaces, must stay unique across the draft list, and can be up to 15 characters.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <input
                          id={`label-name-${draft.tempId}`}
                          type="text"
                          ref={(element) => {
                            nameInputRefs.current[draft.tempId] = element;
                          }}
                          value={draft.name}
                          onChange={(event) => updateDraft(draft.tempId, { name: event.target.value })}
                          onBlur={() => markDraftTouched(draft.tempId)}
                          maxLength={MAX_LABEL_NAME_LENGTH}
                          placeholder="e.g., Bug, Design, Backend"
                          className={`w-full px-4 py-3 border-2 rounded-xl transition-[border-color,box-shadow,color,background-color] duration-300 ease-out focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent ${modalFieldSurfaceClassName} ${currentTheme.text} ${
                            displayRowError ? "border-red-500" : currentTheme.inputBorder
                          }`}
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <p className={`text-xs ${displayRowError ? "text-red-500" : currentTheme.textMuted}`}>
                            {displayRowError || "Use letters and spaces only. Names must stay unique across the full draft list."}
                          </p>
                          <span className={`text-xs ${currentTheme.textMuted}`}>
                            {trimmedNameLength}/{MAX_LABEL_NAME_LENGTH}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex min-w-0 items-center gap-2">
                          <span className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
                            Label Color
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={helpIconButtonClassName}
                                aria-label="Label color help"
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>
                              Choose any accent color you want. Different labels can reuse the same color.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex flex-wrap gap-2 overflow-visible px-1 py-1">
                          {LABEL_COLORS.map((color) => {
                            const isSelected = draft.color === color;
                            const colorChipClassName = getInputLikeControlClassName(currentTheme, {
                              selected: isSelected,
                              surfaceClassName: "",
                              selectedSurfaceClassName: "",
                            });

                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => updateDraft(draft.tempId, { color })}
                                className={`flex h-11 w-11 items-center justify-center rounded-full ${colorChipClassName} ${isSelected ? selectedColorChipClasses : ""}`}
                                style={{ backgroundColor: color }}
                                aria-label={`Choose label color ${color}`}
                                aria-pressed={isSelected}
                              >
                                {isSelected ? <Check className="h-4 w-4 text-white" aria-hidden="true" /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>
    </FormModalFrame>
  );
}
