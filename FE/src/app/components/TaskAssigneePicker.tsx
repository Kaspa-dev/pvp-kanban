import { PencilLine, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { TaskAssignee } from "../utils/cards";

interface TaskAssigneePickerProps {
  id: string;
  availableAssignees: TaskAssignee[];
  selectedAssignee: TaskAssignee | null;
  onSelectedAssigneeChange: (assignee: TaskAssignee | null) => void;
}

function matchesAssigneeQuery(assignee: TaskAssignee, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [assignee.displayName, assignee.username, assignee.email]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function TaskAssigneePicker({
  id,
  availableAssignees,
  selectedAssignee,
  onSelectedAssigneeChange,
}: TaskAssigneePickerProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = `${id}-listbox`;

  const selectedAssigneeOption =
    selectedAssignee && availableAssignees.some((assignee) => assignee.userId === selectedAssignee.userId)
      ? selectedAssignee
      : null;

  const visibleAssignees = useMemo(
    () => availableAssignees.filter((assignee) => matchesAssigneeQuery(assignee, query)).slice(0, 2),
    [availableAssignees, query],
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSelectAssignee = (assignee: TaskAssignee) => {
    onSelectedAssigneeChange(assignee);
    setQuery("");
    setHighlightedIndex(0);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectedAssigneeChange(null);
    setQuery("");
    setHighlightedIndex(availableAssignees.length > 0 ? 0 : -1);
    setIsOpen(false);
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
        handleSelectAssignee(assignee);
      }
    }
  };

  const idleSurfaceClassName = isDarkMode
    ? "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
    : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100";

  return (
    <div ref={containerRef} className="relative">
      {selectedAssigneeOption && !isOpen ? (
        <div className={`flex min-h-[52px] items-center justify-between gap-3 rounded-xl border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} px-3 py-2`}>
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: selectedAssigneeOption.color }}
            >
              {selectedAssigneeOption.displayName.charAt(0).toUpperCase()}
            </div>
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
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setHighlightedIndex(availableAssignees.length > 0 ? 0 : -1);
                  setIsOpen(true);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${idleSurfaceClassName}`}
                aria-label="Change assignee"
              >
                <PencilLine className="h-3.5 w-3.5" />
                Change
              </button>
              <button
                type="button"
                onClick={handleClear}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${idleSurfaceClassName}`}
                aria-label="Clear selected assignee"
              >
                Clear
              </button>
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
              const nextMatches = availableAssignees
                .filter((assignee) => matchesAssigneeQuery(assignee, nextQuery))
                .slice(0, 2);
              setQuery(nextQuery);
              setHighlightedIndex(nextMatches.length > 0 ? 0 : -1);
              setIsOpen(true);
            }}
            onFocus={() => {
              setHighlightedIndex(visibleAssignees.length > 0 ? 0 : -1);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              availableAssignees.length === 0
                ? "No board members available"
                : "Search members"
            }
            disabled={availableAssignees.length === 0}
            className={`min-h-[52px] w-full rounded-xl border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} py-3 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 ${currentTheme.focus} disabled:cursor-not-allowed disabled:opacity-60`}
          />
        </div>
      )}

      {isOpen && availableAssignees.length > 0 && (
        <div className={`absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border ${currentTheme.border} ${currentTheme.cardBg} shadow-2xl`}>
          {visibleAssignees.length === 0 ? (
            <div className={`px-4 py-4 text-sm ${currentTheme.textMuted}`}>
              No board members match your search.
            </div>
          ) : (
            <div id={listboxId} role="listbox" className="py-2">
              {visibleAssignees.map((assignee, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = selectedAssigneeOption?.userId === assignee.userId;

                return (
                  <button
                    key={assignee.userId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectAssignee(assignee)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      isHighlighted
                        ? `${currentTheme.primaryBg} ${currentTheme.primaryText}`
                        : `${currentTheme.text} ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-50"}`
                    }`}
                  >
                    <div
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: assignee.color }}
                    >
                      {assignee.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{assignee.displayName}</p>
                      <p className={`truncate text-xs ${isHighlighted ? "opacity-80" : currentTheme.textMuted}`}>
                        @{assignee.username}
                        {assignee.email ? ` | ${assignee.email}` : ""}
                      </p>
                    </div>
                    {isSelected && <span className="sr-only">Selected assignee</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
