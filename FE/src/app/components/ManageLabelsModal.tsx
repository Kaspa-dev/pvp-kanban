import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Palette, Tag } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { FormModalFrame } from "./FormModalFrame";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  getPrimaryModalActionButtonClassName,
  getSecondaryModalActionButtonClassName,
} from "./modalActionButtonStyles";
import {
  DEFAULT_LABEL_COLOR,
  LABEL_COLORS,
  Label,
  MAX_BOARD_LABELS,
  MAX_LABEL_NAME_LENGTH,
  normalizeLabelName,
} from "../utils/labels";

interface ManageLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: Label[];
  onCreateLabel: (name: string, color: string) => Promise<Label>;
}

export function ManageLabelsModal({
  isOpen,
  onClose,
  labels,
  onCreateLabel,
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
  const sectionTitleClassName = `text-lg font-semibold ${currentTheme.text}`;
  const sectionDescriptionClassName = `text-sm ${currentTheme.textMuted}`;
  const sectionDividerClassName = isDarkMode
    ? "h-px rounded-full bg-zinc-800"
    : "h-px rounded-full bg-gray-200";

  const [labelName, setLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(DEFAULT_LABEL_COLOR);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setLabelName("");
      setSelectedColor(DEFAULT_LABEL_COLOR);
      setIsSubmitting(false);
      setSubmitAttempted(false);
      setServerError("");
    }
  }, [isOpen]);

  const trimmedLabelName = labelName.trim();
  const normalizedNewLabelName = normalizeLabelName(labelName);
  const hasReachedLabelLimit = labels.length >= MAX_BOARD_LABELS;
  const remainingLabelSlots = Math.max(MAX_BOARD_LABELS - labels.length, 0);
  const isDuplicateName = normalizedNewLabelName.length > 0 && labels.some(
    (label) => normalizeLabelName(label.name) === normalizedNewLabelName,
  );

  const validationError = useMemo(() => {
    if (hasReachedLabelLimit) {
      return `This board already has ${MAX_BOARD_LABELS} labels.`;
    }

    if (!trimmedLabelName) {
      return "Label name is required.";
    }

    if (trimmedLabelName.length > MAX_LABEL_NAME_LENGTH) {
      return `Label names can be up to ${MAX_LABEL_NAME_LENGTH} characters.`;
    }

    if (isDuplicateName) {
      return "A label with this name already exists on the board.";
    }

    return "";
  }, [hasReachedLabelLimit, isDuplicateName, trimmedLabelName]);

  const visibleError = submitAttempted ? validationError || serverError : serverError;
  const canSubmit = !validationError && !isSubmitting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setServerError("");

    if (validationError) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateLabel(trimmedLabelName, selectedColor);
      setLabelName("");
      setSelectedColor(DEFAULT_LABEL_COLOR);
      setSubmitAttempted(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create the label right now.";
      setServerError(message);
    } finally {
      setIsSubmitting(false);
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
      description="Create shared board labels and review the ones already available to the team."
      closeAriaLabel="Close labels modal"
      onSubmit={handleSubmit}
      maxWidthClassName="max-w-2xl"
      height="min(90vh, 52rem)"
      viewportClassName="h-full min-h-0 pr-4"
      contentClassName="space-y-6 px-1 py-1"
      footer={(
        <>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 px-5 py-3 font-semibold ${secondaryActionButtonClassName}`}
          >
            Close
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex-1 px-5 py-3 font-semibold ${primaryActionButtonClassName}`}
          >
            {isSubmitting ? "Creating..." : "Create Label"}
          </button>
        </>
      )}
    >
              <section className="space-y-6" aria-labelledby="create-label-heading">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Tag className={`h-4 w-4 ${currentTheme.primaryText}`} />
                      <h3 id="create-label-heading" className={sectionTitleClassName}>
                        Create a shared board label
                      </h3>
                    </div>
                    <p className={sectionDescriptionClassName}>
                      Labels appear in task forms, board filters, and summaries so the team can group related work quickly.
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <label htmlFor="board-label-name" className={`block text-sm font-semibold ${currentTheme.textSecondary}`}>
                        Label Name <span className="text-red-500">*</span>
                      </label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`}
                            aria-label="Label naming help"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>
                          Keep the name short and recognizable so teammates can reuse it consistently.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <input
                      id="board-label-name"
                      type="text"
                      value={labelName}
                      onChange={(event) => {
                        setLabelName(event.target.value);
                        setServerError("");
                      }}
                      maxLength={MAX_LABEL_NAME_LENGTH}
                      placeholder="e.g., Bug, Design, Backend"
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-[border-color,box-shadow,color,background-color] duration-300 ease-out focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent ${modalFieldSurfaceClassName} ${currentTheme.text} ${
                        visibleError ? "border-red-500" : currentTheme.inputBorder
                      }`}
                      autoFocus
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className={`text-xs ${visibleError ? "text-red-500" : currentTheme.textMuted}`}>
                        {visibleError || "Use a unique label name for this board. Duplicate names are blocked."}
                      </p>
                      <span className={`text-xs ${currentTheme.textMuted}`}>
                        {trimmedLabelName.length}/{MAX_LABEL_NAME_LENGTH}
                      </span>
                    </div>
                  </div>

                  <div className={`rounded-2xl border ${currentTheme.border} ${modalSecondarySurfaceClassName} p-4`}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Palette className={`h-4 w-4 shrink-0 ${currentTheme.primaryText}`} />
                        <h4 className={`text-sm font-semibold ${currentTheme.text}`}>
                          Choose a label color
                        </h4>
                      </div>
                      <span className={`text-xs ${currentTheme.textMuted}`}>
                        {hasReachedLabelLimit
                          ? `Limit reached (${MAX_BOARD_LABELS}/${MAX_BOARD_LABELS})`
                          : `${remainingLabelSlots} of ${MAX_BOARD_LABELS} slots left`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {LABEL_COLORS.map((color) => {
                        const isSelected = selectedColor === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`h-9 w-9 rounded-xl border transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${
                              isSelected
                                ? "scale-105 border-white/70 shadow-md ring-2 ring-offset-0 ring-slate-400"
                                : "border-black/5 hover:scale-[1.03] dark:border-white/10"
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Choose label color ${color}`}
                            aria-pressed={isSelected}
                          />
                        );
                      })}
                    </div>
                    <p className={`mt-3 text-sm ${currentTheme.textMuted}`}>
                      Pick one accent color for the label. Long names are capped at {MAX_LABEL_NAME_LENGTH} characters to keep the board tidy.
                    </p>
                  </div>
                </section>

                <div className={`-mx-1 ${sectionDividerClassName}`} aria-hidden="true" />

              <section className="space-y-4" aria-labelledby="existing-labels-heading">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Tag className={`h-4 w-4 ${currentTheme.primaryText}`} />
                      <h3 id="existing-labels-heading" className={sectionTitleClassName}>
                        Review existing labels
                      </h3>
                    </div>
                    <p className={sectionDescriptionClassName}>
                      Reuse the board&apos;s current labels when possible to keep filters and task organization predictable.
                    </p>
                  </div>

                  {labels.length === 0 ? (
                    <div className={`rounded-2xl border border-dashed ${currentTheme.border} ${modalSecondarySurfaceClassName} px-5 py-8 text-center`}>
                      <p className={`text-sm font-medium ${currentTheme.text}`}>No labels have been created yet</p>
                      <p className={`mt-2 text-sm ${currentTheme.textMuted}`}>
                        Create the first label above and it will immediately become available in task forms and filters.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {labels.map((label) => (
                        <div
                          key={label.id}
                          className={`flex min-w-0 items-center gap-3 rounded-2xl border ${currentTheme.border} ${modalSecondarySurfaceClassName} px-4 py-3`}
                        >
                          <span
                            className="h-4 w-4 shrink-0 rounded-full shadow-sm"
                            style={{ backgroundColor: label.color }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>{label.name}</p>
                            <p className={`text-xs ${currentTheme.textMuted}`}>
                              Ready to use in task creation and filtering
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </section>
    </FormModalFrame>
  );
}
