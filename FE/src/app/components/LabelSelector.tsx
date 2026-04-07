import { useState } from "react";
import { Tag, Plus, X, ChevronDown } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Label, LABEL_COLORS } from "../utils/labels";
import * as Popover from "@radix-ui/react-popover";

interface LabelSelectorProps {
  availableLabels: Label[];
  selectedLabelIds: number[];
  onLabelsChange: (labelIds: number[]) => void;
  onCreateLabel: (name: string, color: string) => Promise<void>;
}

export function LabelSelector({
  availableLabels,
  selectedLabelIds,
  onLabelsChange,
  onCreateLabel,
}: LabelSelectorProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [createError, setCreateError] = useState("");

  const selectedLabels = availableLabels.filter((label) => selectedLabelIds.includes(label.id));

  const toggleLabel = (labelId: number) => {
    if (selectedLabelIds.includes(labelId)) {
      onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      onLabelsChange([...selectedLabelIds, labelId]);
    }
  };

  const removeLabel = (labelId: number) => {
    onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;

    try {
      setCreateError("");
      await onCreateLabel(newLabelName.trim(), newLabelColor);
      setNewLabelName("");
      setNewLabelColor(LABEL_COLORS[0]);
      setIsCreating(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create the label right now.");
    }
  };

  return (
    <div>
      <label className={`block text-sm font-semibold mb-2 ${currentTheme.text}`}>
        Labels
      </label>

      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedLabels.map((label) => (
            <button
              key={label.id}
              onClick={() => removeLabel(label.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ backgroundColor: label.color }}
            >
              <span>{label.name}</span>
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 border-2 ${currentTheme.inputBorder} rounded-xl hover:${currentTheme.borderHover} transition-colors text-left ${currentTheme.inputBg}`}
          >
            <div className="flex items-center gap-2">
              <Tag className={`w-4 h-4 ${currentTheme.textMuted}`} />
              <span className={`text-sm font-medium ${currentTheme.text}`}>
                {selectedLabels.length === 0 ? "Select labels" : `${selectedLabels.length} selected`}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 ${currentTheme.textMuted}`} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className={`${currentTheme.cardBg} rounded-xl shadow-xl border-2 ${currentTheme.border} p-3 w-80 z-50 animate-in fade-in zoom-in-95 duration-200`}
            sideOffset={5}
            align="start"
          >
            {isCreating ? (
              <div className={`mb-3 p-3 ${currentTheme.bgSecondary} rounded-lg border-2 ${currentTheme.border}`}>
                <p className={`text-xs font-bold ${currentTheme.text} mb-2`}>Create New Label</p>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(event) => setNewLabelName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleCreateLabel();
                    }
                  }}
                  placeholder="Label name"
                  className={`w-full px-3 py-2 mb-2 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-lg text-sm focus:outline-none focus:ring-2 ${currentTheme.ring} focus:border-transparent`}
                  autoFocus
                />

                <div className="flex gap-1.5 flex-wrap mb-2">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewLabelColor(color)}
                      className={`w-6 h-6 rounded transition-all ${
                        newLabelColor === color ? "ring-2 ring-gray-900 ring-offset-1 scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {createError && (
                  <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {createError}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCreateLabel()}
                    disabled={!newLabelName.trim()}
                    className={`flex-1 px-3 py-1.5 bg-gradient-to-r ${currentTheme.primary} text-white text-sm font-semibold rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setCreateError("");
                      setNewLabelName("");
                      setNewLabelColor(LABEL_COLORS[0]);
                    }}
                    className="px-3 py-1.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCreateError("");
                  setIsCreating(true);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 mb-2 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-lg hover:scale-105 transition-all text-sm`}
              >
                <Plus className="w-4 h-4" />
                Create new label
              </button>
            )}

            <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
              {availableLabels.length === 0 ? (
                <p className={`text-sm ${currentTheme.textMuted} italic text-center py-4`}>
                  No labels yet. Create one above!
                </p>
              ) : (
                availableLabels.map((label) => {
                  const isSelected = selectedLabelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabel(label.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                        isSelected
                          ? `bg-gradient-to-r ${currentTheme.primary} text-white`
                          : `${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${isSelected ? "bg-white" : ""}`}
                        style={{ backgroundColor: isSelected ? "white" : label.color }}
                      />
                      <span className={`text-sm font-medium flex-1 ${isSelected ? "text-white" : currentTheme.text}`}>{label.name}</span>
                      {isSelected && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
