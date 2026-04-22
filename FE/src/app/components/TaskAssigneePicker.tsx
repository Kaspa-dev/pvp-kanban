import { PencilLine, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { TaskAssignee } from "../utils/cards";
import { AppAvatar } from "./AppAvatar";
import { UtilityIconButton } from "./UtilityIconButton";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";

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
  const pickerSurfaceClassName = "bg-input-background dark:bg-input/30";
  const pickerShadowClassName = isDarkMode
    ? "shadow-[0_20px_48px_rgba(0,0,0,0.58)]"
    : "shadow-[0_20px_44px_rgba(15,23,42,0.22)]";

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [anchorWidth, setAnchorWidth] = useState<number | null>(null);

  const anchorRef = useRef<HTMLDivElement | null>(null);
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

  const subtleActionButtonClassName = `w-auto gap-1.5 px-2.5 text-xs font-semibold shadow-none ${currentTheme.inputBorder} ${pickerSurfaceClassName} ${currentTheme.textSecondary}`;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
              onClick={() => {
                setQuery("");
                setHighlightedIndex(availableAssignees.length > 0 ? 0 : -1);
                setIsOpen(true);
              }}
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
            className={`min-h-[52px] w-full rounded-xl border-2 ${currentTheme.inputBorder} ${pickerSurfaceClassName} ${currentTheme.text} placeholder:${currentTheme.textMuted} py-3 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 ${currentTheme.focus} disabled:cursor-not-allowed disabled:opacity-60`}
          />
        </div>
      )}
        </div>
      </PopoverAnchor>

      {isOpen && availableAssignees.length > 0 && (
        <PopoverContent
          align="start"
          sideOffset={8}
          style={anchorWidth ? { width: anchorWidth } : undefined}
          className={`z-30 overflow-hidden rounded-2xl border p-0 ${currentTheme.border} ${pickerSurfaceClassName} ${pickerShadowClassName}`}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {visibleAssignees.length === 0 ? (
            <div className={`px-4 py-4 text-sm ${pickerSurfaceClassName} ${currentTheme.textMuted}`}>
              No board members match your search.
            </div>
          ) : (
            <div id={listboxId} role="listbox" className={`py-2 ${pickerSurfaceClassName}`}>
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
                    {isSelected && <span className="sr-only">Selected assignee</span>}
                  </button>
                );
              })}
            </div>
          )}
        </PopoverContent>
      )}
    </Popover>
  );
}
