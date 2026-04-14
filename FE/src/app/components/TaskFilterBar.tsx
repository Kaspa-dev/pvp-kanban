import * as Popover from "@radix-ui/react-popover";
import { Search, Tag } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Label } from "../utils/labels";
import { BacklogStageFilter, TaskQuickFilter } from "../utils/taskWorkspaceFilters";
import { CustomScrollArea } from "./CustomScrollArea";

interface TaskFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  quickFilter: TaskQuickFilter;
  onQuickFilterChange: (filter: TaskQuickFilter) => void;
  labels: Label[];
  selectedLabelIds: number[];
  onSelectedLabelIdsChange: (labelIds: number[]) => void;
  resultsLabel: string;
  stageFilter?: BacklogStageFilter;
  onStageFilterChange?: (filter: BacklogStageFilter) => void;
}

const QUICK_FILTERS: Array<{ id: TaskQuickFilter; label: string }> = [
  { id: "all", label: "All Tasks" },
  { id: "assigned", label: "Assigned To Me" },
  { id: "due", label: "Due This Week" },
];

const STAGE_FILTERS: Array<{ id: BacklogStageFilter; label: string }> = [
  { id: "all", label: "All Stages" },
  { id: "waiting", label: "Waiting" },
  { id: "queued", label: "Queued" },
];

export function TaskFilterBar({
  searchQuery,
  onSearchChange,
  quickFilter,
  onQuickFilterChange,
  labels,
  selectedLabelIds,
  onSelectedLabelIdsChange,
  resultsLabel,
  stageFilter,
  onStageFilterChange,
}: TaskFilterBarProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const toggleLabel = (labelId: number) => {
    if (selectedLabelIds.includes(labelId)) {
      onSelectedLabelIdsChange(selectedLabelIds.filter((value) => value !== labelId));
      return;
    }

    onSelectedLabelIdsChange([...selectedLabelIds, labelId]);
  };

  return (
    <div className={`rounded-[26px] border px-5 py-5 ${currentTheme.border} ${currentTheme.cardBg} shadow-sm`}>
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <label className={`block text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
              Search Tasks
            </label>
            <div className="relative">
              <Search className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search by task title or label"
                className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm ${currentTheme.cardBg} ${currentTheme.border} ${currentTheme.text} placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className={`block text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                Quick Filter
              </span>
              <div className={`flex flex-wrap gap-2 rounded-xl border p-1.5 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                {QUICK_FILTERS.map((filter) => {
                  const isActive = quickFilter === filter.id;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => onQuickFilterChange(filter.id)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-sm`
                          : `${currentTheme.textSecondary} hover:${currentTheme.primaryText}`
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className={`block text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                Labels
              </span>
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.text}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Tag className={`h-4 w-4 shrink-0 ${selectedLabelIds.length > 0 ? currentTheme.primaryText : currentTheme.textMuted}`} />
                      <span className="truncate">
                        {selectedLabelIds.length > 0 ? `${selectedLabelIds.length} labels selected` : "Filter by labels"}
                      </span>
                    </span>
                    <span className={`text-xs ${currentTheme.textMuted}`}>Open</span>
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    sideOffset={10}
                    align="start"
                    className={`z-50 w-72 rounded-2xl border p-3 shadow-2xl ${currentTheme.cardBg} ${currentTheme.border}`}
                  >
                    <div className="mb-3 px-1">
                      <h4 className={`text-xs font-bold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                        Filter By Labels
                      </h4>
                    </div>

                    <div className={`rounded-2xl border p-1 ${currentTheme.border}`}>
                      {labels.length === 0 ? (
                        <div className={`px-4 py-4 text-sm ${currentTheme.textMuted}`}>
                          No labels available yet.
                        </div>
                      ) : (
                        <CustomScrollArea viewportClassName="max-h-64 py-1 pr-1">
                          <div className="space-y-1">
                            {labels.map((label) => {
                              const isSelected = selectedLabelIds.includes(label.id);

                              return (
                                <button
                                  key={label.id}
                                  type="button"
                                  onClick={() => toggleLabel(label.id)}
                                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                    isSelected
                                      ? `${currentTheme.primaryBg} ${currentTheme.primaryText}`
                                      : `${currentTheme.text} ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-50"}`
                                  }`}
                                >
                                  <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
                                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{label.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </CustomScrollArea>
                      )}
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>
        </div>

        {onStageFilterChange && stageFilter && (
          <div className="space-y-2">
            <span className={`block text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
              Queue State
            </span>
            <div className={`flex flex-wrap gap-2 rounded-xl border p-1.5 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
              {STAGE_FILTERS.map((filter) => {
                const isActive = stageFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => onStageFilterChange(filter.id)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-sm`
                        : `${currentTheme.textSecondary} hover:${currentTheme.primaryText}`
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedLabelIds.length > 0 && (
          <div className="space-y-2">
            <span className={`block text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
              Active Labels
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedLabelIds.map((labelId) => {
                const label = labels.find((item) => item.id === labelId);
                if (!label) {
                  return null;
                }

                return (
                  <button
                    key={labelId}
                    type="button"
                    onClick={() => toggleLabel(labelId)}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                    style={{ backgroundColor: label.color }}
                  >
                    <span className="max-w-[10rem] truncate">{label.name}</span>
                    <span aria-hidden="true">x</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className={`flex items-center justify-between border-t pt-4 ${currentTheme.border}`}>
          <p className={`text-sm ${currentTheme.textSecondary}`}>{resultsLabel}</p>
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onQuickFilterChange("all");
              onSelectedLabelIdsChange([]);
              onStageFilterChange?.("all");
            }}
            className={`text-xs font-semibold uppercase tracking-[0.14em] ${currentTheme.textMuted} hover:${currentTheme.primaryText}`}
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
