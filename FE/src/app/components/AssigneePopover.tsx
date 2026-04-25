import { Loader2, Plus, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { searchBoardAssignees, TaskAssignee } from "../utils/cards";
import { AppAvatar } from "./AppAvatar";
import { UtilityIconButton } from "./UtilityIconButton";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getIconActionButtonClassName } from "./iconActionButtonStyles";

interface AssigneePopoverProps {
  boardId: number;
  currentAssignee: TaskAssignee;
  onAssigneeChange: (assignee: TaskAssignee | null) => void;
  availableAssignees: TaskAssignee[];
}

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_RESULT_LIMIT = 3;
const RESULTS_PANEL_HEIGHT_CLASS = "h-[13rem]";

export function AssigneePopover({
  boardId,
  currentAssignee,
  onAssigneeChange,
  availableAssignees,
}: AssigneePopoverProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const pickerSurfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-input-background";
  const pickerShadowClassName = isDarkMode
    ? "shadow-[0_20px_48px_rgba(0,0,0,0.58)]"
    : "shadow-[0_20px_44px_rgba(15,23,42,0.22)]";
  const triggerButtonBaseClassName = getIconActionButtonClassName(currentTheme, { shape: "pill" });
  const subtleActionButtonClassName = `w-auto gap-1.5 px-2.5 text-xs font-semibold shadow-none ${currentTheme.inputBorder} ${pickerSurfaceClassName} ${currentTheme.textSecondary}`;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaskAssignee[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef(0);
  const listboxId = useId();
  const normalizedQuery = query.trim();

  const resolvedCurrentAssignee =
    currentAssignee.userId !== 0
      ? availableAssignees.find((assignee) => assignee.userId === currentAssignee.userId) ?? currentAssignee
      : currentAssignee;

  const isUnassigned =
    resolvedCurrentAssignee.userId === 0 || resolvedCurrentAssignee.name === "Unassigned";

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!normalizedQuery) {
      setResults([]);
      setError("");
      setIsLoading(false);
      setHighlightedIndex(-1);
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

        const message =
          searchError instanceof Error ? searchError.message : "Unable to search board members right now.";
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
  }, [boardId, isOpen, normalizedQuery]);

  const resetSearchState = () => {
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setError("");
    setIsLoading(false);
    setHighlightedIndex(0);
  };

  const handleSelectAssignee = (assignee: TaskAssignee) => {
    if (!isUnassigned && assignee.userId === resolvedCurrentAssignee.userId) {
      setIsOpen(false);
      resetSearchState();
      return;
    }

    onAssigneeChange(assignee);
    resetSearchState();
    setIsOpen(false);
  };

  const handleClear = () => {
    if (isUnassigned) {
      return;
    }

    onAssigneeChange(null);
    resetSearchState();
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (!isOpen || results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((previous) => (previous + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((previous) =>
        previous <= 0 ? results.length - 1 : previous - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const assignee = results[highlightedIndex] ?? results[0];
      if (assignee) {
        handleSelectAssignee(assignee);
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
        <div ref={anchorRef} className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className={`relative text-xs font-semibold transition-all ${
                    isUnassigned
                      ? `${triggerButtonBaseClassName} border ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-white"}`
                      : "inline-flex items-center justify-center rounded-full transition-transform hover:scale-105"
                  }`}
                  aria-label={isUnassigned ? "Assign task" : `Assigned to ${resolvedCurrentAssignee.name}`}
                >
                  {isUnassigned ? (
                    <Plus className="h-3.5 w-3.5" />
                  ) : (
                    <AppAvatar
                      username={resolvedCurrentAssignee.username || resolvedCurrentAssignee.name}
                      fullName={resolvedCurrentAssignee.displayName || resolvedCurrentAssignee.name}
                      size={32}
                      className="pointer-events-none shadow-sm"
                      interactive={false}
                      enableBlink={false}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {isUnassigned ? "Assign task" : `Assigned to ${resolvedCurrentAssignee.name}`}
            </TooltipContent>
          </Tooltip>
        </div>
      </PopoverAnchor>

      {isOpen && Number.isFinite(boardId) && boardId > 0 ? (
        <PopoverContent
          align="start"
          sideOffset={8}
          className={`z-30 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border p-0 ${currentTheme.border} ${pickerSurfaceClassName} ${pickerShadowClassName}`}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className={`border-b px-4 py-3 ${currentTheme.border} ${pickerSurfaceClassName}`}>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-sm font-semibold ${currentTheme.text}`}>Assign task</p>
              <UtilityIconButton
                type="button"
                size="sm"
                emphasis="elevated"
                onClick={handleClear}
                className={`${subtleActionButtonClassName} ${isUnassigned ? "pointer-events-none invisible" : ""}`}
                aria-hidden={isUnassigned}
                tabIndex={isUnassigned ? -1 : 0}
              >
                Clear
              </UtilityIconButton>
            </div>
          </div>

          <div className={`p-3 ${pickerSurfaceClassName}`}>
            <div className="relative">
              <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-autocomplete="list"
                autoComplete="off"
                value={query}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  setIsOpen(true);
                }}
                onFocus={() => {
                  setIsOpen(true);
                  setHighlightedIndex(results.length > 0 ? 0 : -1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search members by name, username, or email prefix"
                disabled={!Number.isFinite(boardId) || boardId <= 0}
                className={`min-h-[52px] w-full rounded-xl border-2 ${currentTheme.inputBorder} ${pickerSurfaceClassName} ${currentTheme.text} placeholder:${currentTheme.textMuted} py-3 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 ${currentTheme.focus} disabled:cursor-not-allowed disabled:opacity-60`}
              />
            </div>
          </div>

          {error ? (
            <div className={`flex ${RESULTS_PANEL_HEIGHT_CLASS} items-center px-4 py-3 text-sm text-red-600`}>
              {error}
            </div>
          ) : isLoading ? (
            <div className={`flex ${RESULTS_PANEL_HEIGHT_CLASS} items-center justify-center gap-2 px-4 py-5 text-sm ${currentTheme.textMuted}`}>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Searching members...</span>
            </div>
          ) : !normalizedQuery ? (
            <div className={`flex ${RESULTS_PANEL_HEIGHT_CLASS} items-center justify-center px-4 py-3 text-sm ${currentTheme.textMuted}`}>
              Start typing to search board members.
            </div>
          ) : results.length === 0 ? (
            <div className={`flex ${RESULTS_PANEL_HEIGHT_CLASS} items-center justify-center px-4 py-3 text-sm ${currentTheme.textMuted}`}>
              No board members match your search.
            </div>
          ) : (
            <div id={listboxId} role="listbox" className={`${RESULTS_PANEL_HEIGHT_CLASS} py-2 ${pickerSurfaceClassName}`}>
              {results.map((assignee, index) => {
                const isSelected = !isUnassigned && resolvedCurrentAssignee.userId === assignee.userId;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={assignee.userId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelectAssignee(assignee)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      isHighlighted
                        ? `${currentTheme.primaryBg} ${currentTheme.primaryText}`
                        : `${pickerSurfaceClassName} ${currentTheme.text} ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-100"}`
                    }`}
                  >
                    <AppAvatar
                      username={assignee.username || assignee.displayName}
                      fullName={assignee.displayName}
                      size={36}
                      className="mt-0.5 shrink-0 shadow-sm"
                      interactive={false}
                      enableBlink={false}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{assignee.displayName}</p>
                      <p className={`truncate text-xs ${isHighlighted ? "opacity-80" : currentTheme.textMuted}`}>
                        @{assignee.username}
                        {assignee.email ? ` | ${assignee.email}` : ""}
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="sr-only">Selected assignee</span>
                    ) : null}
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
