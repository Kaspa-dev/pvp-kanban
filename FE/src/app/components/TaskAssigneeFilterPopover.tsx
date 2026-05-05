import { Check, ChevronDown, Loader2, Search, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { getBoardAssigneeSuggestions, searchBoardAssignees, TaskAssignee } from "../utils/cards";
import { getWorkspaceControlSurfaceClassName } from "../utils/workspaceSurfaceStyles";
import { AppAvatar } from "./AppAvatar";
import { getInputLikeControlClassName } from "./inputLikeControlStyles";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";

interface TaskAssigneeFilterPopoverProps {
  boardId: number;
  availableAssignees: TaskAssignee[];
  selectedAssigneeUserIds: number[];
  onSelectedAssigneeUserIdsChange: (assigneeUserIds: number[]) => void;
  tooltipId?: string;
}

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_RESULT_LIMIT = 3;
const RESULTS_PANEL_HEIGHT_CLASS = "h-[13rem]";

function getAssigneeFilterSummary(selectedAssignees: TaskAssignee[]) {
  if (selectedAssignees.length === 0) {
    return "Filter by assignee";
  }

  return `${selectedAssignees.length} ${selectedAssignees.length === 1 ? "user" : "users"} selected`;
}

export function TaskAssigneeFilterPopover({
  boardId,
  availableAssignees,
  selectedAssigneeUserIds,
  onSelectedAssigneeUserIdsChange,
  tooltipId,
}: TaskAssigneeFilterPopoverProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const pickerSurfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-input-background";
  const triggerClassName = getInputLikeControlClassName(currentTheme, {
    surfaceClassName: getWorkspaceControlSurfaceClassName(),
  });
  const pickerShadowClassName = isDarkMode
    ? "shadow-[0_20px_48px_rgba(0,0,0,0.58)]"
    : "shadow-[0_20px_44px_rgba(15,23,42,0.22)]";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaskAssignee[]>([]);
  const [suggestions, setSuggestions] = useState<TaskAssignee[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [error, setError] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef(0);
  const normalizedQuery = query.trim();
  const selectedAssignees = useMemo(
    () =>
      selectedAssigneeUserIds
        .map((userId) => availableAssignees.find((assignee) => assignee.userId === userId))
        .filter((assignee): assignee is TaskAssignee => Boolean(assignee)),
    [availableAssignees, selectedAssigneeUserIds],
  );
  const selectedAssigneeSet = useMemo(() => new Set(selectedAssigneeUserIds), [selectedAssigneeUserIds]);
  const visibleAssignees = normalizedQuery ? results : suggestions;

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || normalizedQuery || !Number.isFinite(boardId) || boardId <= 0) {
      return;
    }

    let isActive = true;
    setIsLoadingSuggestions(true);

    void getBoardAssigneeSuggestions(boardId, SEARCH_RESULT_LIMIT)
      .then((nextSuggestions) => {
        if (!isActive) {
          return;
        }

        setSuggestions(nextSuggestions);
        setHighlightedIndex(nextSuggestions.length > 0 ? 0 : -1);
      })
      .catch(() => {
        if (isActive) {
          setSuggestions([]);
          setHighlightedIndex(-1);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingSuggestions(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [boardId, isOpen, normalizedQuery]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!normalizedQuery) {
      setResults([]);
      setError("");
      setIsLoading(false);
      setHighlightedIndex(suggestions.length > 0 ? 0 : -1);
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    setIsLoading(true);
    setError("");

    const timeoutId = window.setTimeout(async () => {
      try {
        const nextResults = await searchBoardAssignees(boardId, normalizedQuery, SEARCH_RESULT_LIMIT);
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        setResults(nextResults);
        setHighlightedIndex(nextResults.length > 0 ? 0 : -1);
      } catch (searchError) {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        const message = searchError instanceof Error ? searchError.message : "Unable to search board members right now.";
        setResults([]);
        setError(message);
        setHighlightedIndex(-1);
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setIsLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [boardId, isOpen, normalizedQuery, suggestions.length]);

  const resetSearchState = () => {
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setError("");
    setIsLoading(false);
    setHighlightedIndex(0);
  };

  const toggleAssignee = (assignee: TaskAssignee) => {
    if (selectedAssigneeSet.has(assignee.userId)) {
      onSelectedAssigneeUserIdsChange(selectedAssigneeUserIds.filter((userId) => userId !== assignee.userId));
      return;
    }

    onSelectedAssigneeUserIdsChange([...selectedAssigneeUserIds, assignee.userId]);
  };

  const clearSelection = () => {
    onSelectedAssigneeUserIdsChange([]);
    resetSearchState();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (!isOpen || visibleAssignees.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((previous) => (previous + 1) % visibleAssignees.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((previous) =>
        previous <= 0 ? visibleAssignees.length - 1 : previous - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const assignee = visibleAssignees[highlightedIndex] ?? visibleAssignees[0];
      if (assignee) {
        toggleAssignee(assignee);
      }
    }
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetSearchState();
        }

        setIsOpen(open);
      }}
    >
      <PopoverAnchor asChild>
        <button
          type="button"
          aria-describedby={tooltipId}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className={`flex h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm shadow-none ${currentTheme.text} ${triggerClassName} hover:!bg-white dark:hover:!bg-input/30 ${
            isOpen ? `border-transparent ring-2 ${currentTheme.ring}` : ""
          }`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <UserRound className={`h-4 w-4 shrink-0 ${selectedAssigneeUserIds.length > 0 ? currentTheme.primaryText : currentTheme.textMuted}`} />
            <span className={`truncate ${selectedAssigneeUserIds.length === 0 ? currentTheme.textMuted : currentTheme.text}`}>
              {getAssigneeFilterSummary(selectedAssignees)}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 ${currentTheme.textMuted}`} />
        </button>
      </PopoverAnchor>

      {isOpen ? (
        <PopoverContent
          align="start"
          sideOffset={8}
          className={`z-50 w-80 overflow-hidden rounded-2xl border p-0 ${currentTheme.border} ${pickerSurfaceClassName} ${pickerShadowClassName}`}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className={`border-b px-3 py-3 ${currentTheme.border} ${pickerSurfaceClassName}`}>
            <div className="relative">
              <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search name, username, or email prefix"
                className={`min-h-11 w-full rounded-xl border-2 ${currentTheme.inputBorder} ${pickerSurfaceClassName} ${currentTheme.text} placeholder:${currentTheme.textMuted} py-2.5 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 ${currentTheme.focus}`}
              />
            </div>
          </div>

          {selectedAssigneeUserIds.length > 0 ? (
            <div className={`flex items-center justify-between gap-3 border-b px-4 py-2 ${currentTheme.border}`}>
              <span className={`text-xs font-semibold ${currentTheme.textMuted}`}>
                {selectedAssigneeUserIds.length} selected
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${currentTheme.textSecondary} hover:${currentTheme.primaryBg} hover:${currentTheme.primaryText}`}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          ) : null}

          {error ? (
            <div className={`flex ${RESULTS_PANEL_HEIGHT_CLASS} items-center px-4 py-3 text-sm text-red-600`}>
              {error}
            </div>
          ) : isLoading || (isLoadingSuggestions && !normalizedQuery) ? (
            <div className={`flex ${RESULTS_PANEL_HEIGHT_CLASS} items-center justify-center gap-2 px-4 py-5 text-sm ${currentTheme.textMuted}`}>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{normalizedQuery ? "Searching members..." : "Loading suggestions..."}</span>
            </div>
          ) : !normalizedQuery && visibleAssignees.length === 0 ? (
            <div className={`flex ${RESULTS_PANEL_HEIGHT_CLASS} items-center justify-center px-4 py-3 text-sm ${currentTheme.textMuted}`}>
              Start typing to search board members.
            </div>
          ) : normalizedQuery && results.length === 0 ? (
            <div className={`flex ${RESULTS_PANEL_HEIGHT_CLASS} items-center justify-center px-4 py-3 text-sm ${currentTheme.textMuted}`}>
              No board members match your search.
            </div>
          ) : (
            <div role="listbox" aria-label="Filter tasks by assignee" aria-multiselectable="true" className={`${RESULTS_PANEL_HEIGHT_CLASS} overflow-y-auto py-2 ${pickerSurfaceClassName}`}>
              {visibleAssignees.map((assignee, index) => {
                const isSelected = selectedAssigneeSet.has(assignee.userId);
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={assignee.userId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => toggleAssignee(assignee)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? `${currentTheme.primaryBg} ${currentTheme.primaryText}`
                        : isHighlighted
                          ? `${currentTheme.primaryBg} ${currentTheme.primaryText}`
                          : `${pickerSurfaceClassName} ${currentTheme.text} ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-100"}`
                    }`}
                  >
                    <AppAvatar
                      username={assignee.username || assignee.displayName}
                      fullName={assignee.displayName}
                      size={34}
                      className="mt-0.5 shrink-0 shadow-sm"
                      interactive={false}
                      enableBlink={false}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{assignee.displayName}</p>
                      <p className={`truncate text-xs ${isSelected || isHighlighted ? "opacity-80" : currentTheme.textMuted}`}>
                        @{assignee.username}
                      </p>
                    </div>
                    {isSelected ? <Check className="mt-2 h-4 w-4 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          )}
        </PopoverContent>
      ) : null}
    </Popover>
  );
}
