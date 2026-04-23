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
  const helpIconButtonClassName = `inline-flex h-5 w-5 items-center justify-center rounded-full ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;
  const selectedColorChipClasses = `border-transparent ring-2 ${currentTheme.ring} ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 shadow-sm scale-105`;

  const [drafts, setDrafts] = useState<LabelDraft[]>([]);
  const [collapsedDraftIds, setCollapsedDraftIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const nextTempIdRef = useRef(0);

  const createDraftTempId = () => {
    nextTempIdRef.current += 1;
    return `draft-${nextTempIdRef.current}`;
  };

  useEffect(() => {
    if (!isOpen) {
      setDrafts([]);
      setCollapsedDraftIds(new Set());
      setSaveError("");
      setIsSaving(false);
      return;
    }

    nextTempIdRef.current = 0;
    setDrafts(sortLabelsByName(labels).map(createDraftFromLabel));
    setCollapsedDraftIds(new Set());
    setSaveError("");
    setIsSaving(false);
  }, [isOpen, labels]);

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
  const editableDraftIds = useMemo(
    () => drafts.filter((draft) => !draft.isDeleted).map((draft) => draft.tempId),
    [drafts],
  );
  const allEditableRowsCollapsed = editableDraftIds.length > 0
    && editableDraftIds.every((tempId) => collapsedDraftIds.has(tempId));

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

  const hasValidationErrors = activeLabelCount > MAX_BOARD_LABELS || Object.keys(rowErrors).length > 0;
  const canAddLabel = activeLabelCount < MAX_BOARD_LABELS;
  const canSave = !isSaving && !hasValidationErrors;

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

  const handleAddLabel = () => {
    if (!canAddLabel) {
      return;
    }

    setDrafts((currentDrafts) => [
      ...currentDrafts,
      {
        tempId: createDraftTempId(),
        name: "",
        color: DEFAULT_LABEL_COLOR,
        isNew: true,
      },
    ]);
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
    if (editableDraftIds.length === 0) {
      return;
    }

    setCollapsedDraftIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (allEditableRowsCollapsed) {
        editableDraftIds.forEach((tempId) => {
          nextIds.delete(tempId);
        });
      } else {
        editableDraftIds.forEach((tempId) => {
          nextIds.add(tempId);
        });
      }

      return nextIds;
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError("");

    if (!canSave) {
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
      contentClassName="space-y-6 px-1 py-1"
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
            disabled={!canSave}
            className={`flex-1 px-5 py-3 font-semibold ${primaryActionButtonClassName}`}
          >
            {isSaving ? "Saving..." : "Save Labels"}
          </button>
        </>
      )}
    >
      <section className="space-y-5" aria-labelledby="manage-label-list-heading">
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAllEditableRows}
                disabled={editableDraftIds.length === 0}
                className={`inline-flex items-center rounded-lg px-2.5 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${currentTheme.textMuted} hover:${currentTheme.textSecondary} ${currentTheme.focus}`}
              >
                {allEditableRowsCollapsed ? "Expand all" : "Collapse all"}
              </button>

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
          </div>

          <div className={`flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
            <span>M {modifiedCount}</span>
            <span>A {addedCount}</span>
            <span>D {deletedCount}</span>
          </div>

          <p className={sectionDescriptionClassName}>
            {persistedLabelCount} labels currently exist on this board. Deleted labels will be unattached from tasks when you save.
          </p>
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

        <div className="space-y-3">
          {drafts.length === 0 ? (
            <div className={`rounded-2xl border border-dashed ${currentTheme.border} ${modalSecondarySurfaceClassName} px-5 py-8 text-center`}>
              <p className={`text-sm font-medium ${currentTheme.text}`}>No labels yet</p>
              <p className={`mt-2 text-sm ${currentTheme.textMuted}`}>
                Add the first label to start grouping tasks by topic, workflow, or responsibility.
              </p>
              <button
                type="button"
                onClick={handleAddLabel}
                className={`mt-4 ${addLabelButtonClassName}`}
              >
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.24)_50%,transparent_85%)] opacity-0 transition-opacity duration-300 group-hover/add-label:opacity-100" />
                <span className="relative z-10 inline-flex items-center gap-2 leading-none">
                  <Plus className="h-4.5 w-4.5 will-change-transform transition-transform duration-200 group-hover/add-label:rotate-90 group-hover/add-label:scale-110" />
                  <span className="leading-none">Add Label</span>
                </span>
              </button>
            </div>
          ) : (
            drafts.map((draft) => {
              const isDeleted = Boolean(draft.isDeleted);
              const isCollapsed = collapsedDraftIds.has(draft.tempId);
              const rowError = rowErrors[draft.tempId];
              const trimmedNameLength = draft.name.trim().length;
              const showEditableFields = !isDeleted && !isCollapsed;

              return (
                <div
                  key={draft.tempId}
                  className={`rounded-2xl border p-4 ${currentTheme.border} ${modalSecondarySurfaceClassName}`}
                >
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="min-w-0 flex flex-1 items-center">
                      <OverflowTooltip
                        text={draft.name.trim() || "Untitled label"}
                        className={`${labelPreviewChipClassName} ${isDeleted ? "opacity-70 line-through" : ""}`}
                        style={{ backgroundColor: draft.color }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {!isDeleted ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <UtilityIconButton
                              type="button"
                              size="sm"
                              onClick={() => toggleDraftCollapsed(draft.tempId)}
                              aria-label={isCollapsed ? "Expand label details" : "Collapse label details"}
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : "rotate-0"}`} />
                            </UtilityIconButton>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            {isCollapsed ? "Expand details" : "Collapse details"}
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
                              Label names must be unique across the draft list and can be up to 15 characters.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <input
                          id={`label-name-${draft.tempId}`}
                          type="text"
                          value={draft.name}
                          onChange={(event) => updateDraft(draft.tempId, { name: event.target.value })}
                          maxLength={MAX_LABEL_NAME_LENGTH}
                          placeholder="e.g., Bug, Design, Backend"
                          className={`w-full px-4 py-3 border-2 rounded-xl transition-[border-color,box-shadow,color,background-color] duration-300 ease-out focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent ${modalFieldSurfaceClassName} ${currentTheme.text} ${
                            rowError ? "border-red-500" : currentTheme.inputBorder
                          }`}
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <p className={`text-xs ${rowError ? "text-red-500" : currentTheme.textMuted}`}>
                            {rowError || "Label names must be unique across the full draft list."}
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
