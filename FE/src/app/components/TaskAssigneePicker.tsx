import { Loader2, PencilLine, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { searchBoardAssignees, TaskAssignee } from "../utils/cards";
import { AppAvatar } from "./AppAvatar";
import { UtilityIconButton } from "./UtilityIconButton";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";

interface TaskAssigneePickerProps {
  id: string;
  boardId: number;
  availableAssignees: TaskAssignee[];
  selectedAssignee: TaskAssignee | null;
  onSelectedAssigneeChange: (assignee: TaskAssignee | null) => void;
}

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_RESULT_LIMIT = 3;
const RESULTS_PANEL_HEIGHT_CLASS = "h-[13rem]";

export function TaskAssigneePicker({
  id,
  boardId,
  availableAssignees,
  selectedAssignee,
  onSelectedAssigneeChange,
}: TaskAssigneePickerProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const pickerSurfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-input-background";
  const pickerShadowClassName = isDarkMode
    ? "shadow-[0_20px_48px_rgba(0,0,0,0.58)]"
    : "shadow-[0_20px_44px_rgba(15,23,42,0.22)]";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaskAssignee[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [anchorWidth, setAnchorWidth] = useState<number | null>(null);

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef(0);
  const listboxId = `${id}-listbox`;
  const normalizedQuery = query.trim();

  const selectedAssigneeOption =
    selectedAssignee && selectedAssignee.userId !== 0
      ? availableAssignees.find((assignee) => assignee.userId === selectedAssignee.userId) ?? selectedAssignee
      : null;

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const updateAnchorWidth = () => {
      setAnchorWidth(anchor.getBoundingClientRect().width);
    };

    updateAnchorWidth();

    const resizeObserver = new ResizeObserver(updateAnchorWidth);
    resizeObserver.observe(anchor);
    window.addEventListener("resize", updateAnchorWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateAnchorWidth);
    };
  }, []);

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

  const handleSelectAssignee = (assignee: TaskAssignee) => {
    onSelectedAssigneeChange(assignee);
    setQuery("");
    setResults([]);
    setError("");
    setHighlightedIndex(0);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectedAssigneeChange(null);
    setQuery("");
    setResults([]);
    setError("");
    setHighlightedIndex(-1);
    setIsOpen(false);
  };

  const handleOpenSearch = () => {
    setQuery("");
    setResults([]);
    setError("");
    setIsLoading(false);
    setHighlightedIndex(-1);
    setIsOpen(true);
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

  const subtleActionButtonClassName = `w-auto gap-1.5 px-2.5 text-xs font-semibold shadow-none ${currentTheme.inputBorder} ${pickerSurfaceClassName} ${currentTheme.textSecondary}`;

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          requestIdRef.current += 1;
          setQuery("");
          setResults([]);
          setError("");
          setIsLoading(false);
          setHighlightedIndex(0);
        }
        setIsOpen(open);
      }}
    >
      <PopoverAnchor asChild>
        <div ref={anchorRef} className="relative">
          {selectedAssigneeOption && !isOpen ? (
            <div className={`flex h-[52px] items-center justify-between gap-3 rounded-xl border-2 ${currentTheme.inputBorder} ${pickerSurfaceClassName} px-3`}>
              <div className="flex min-w-0 items-center gap-3">
                <AppAvatar
                  username={selectedAssigneeOption.username || selectedAssigneeOption.displayName}
                  fullName={selectedAssigneeOption.displayName}
                  size={32}
                  className="shrink-0 shadow-sm"
                  interactive={false}
                  enableBlink={false}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>
                    {selectedAssigneeOption.displayName}
                  </p>
                  <p className={`truncate text-xs ${currentTheme.textMuted}`}>
                    @{selectedAssigneeOption.username}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <UtilityIconButton
                  type="button"
                  size="sm"
                  emphasis="elevated"
                  onClick={handleOpenSearch}
                  className={subtleActionButtonClassName}
                  aria-label="Change assignee"
                >
                  <PencilLine className="h-3.5 w-3.5" />
                  Change
                </UtilityIconButton>
                <UtilityIconButton
                  type="button"
                  size="sm"
                  emphasis="elevated"
                  onClick={handleClear}
                  className={subtleActionButtonClassName}
                  aria-label="Clear selected assignee"
                >
                  Clear
                </UtilityIconButton>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
              <input
                ref={inputRef}
                id={id}
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
                className={`min-h-[52px] w-full rounded-xl border-2 ${currentTheme.inputBorder} ${pickerSurfaceClassName} ${currentTheme.text} placeholder:${currentTheme.textMuted} py-3 pl-10 pr-10 transition-all focus:border-transparent focus:outline-none focus:ring-2 ${currentTheme.focus} disabled:cursor-not-allowed disabled:opacity-60`}
              />
            </div>
          )}
        </div>
      </PopoverAnchor>

      {isOpen && Number.isFinite(boardId) && boardId > 0 ? (
        <PopoverContent
          align="start"
          sideOffset={8}
          style={anchorWidth ? { width: anchorWidth } : undefined}
          className={`z-30 overflow-hidden rounded-2xl border p-0 ${currentTheme.border} ${pickerSurfaceClassName} ${pickerShadowClassName}`}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
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
                const isSelected = selectedAssigneeOption?.userId === assignee.userId;
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
                    {isSelected ? <span className="sr-only">Selected assignee</span> : null}
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
