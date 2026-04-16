import * as Popover from "@radix-ui/react-popover";
import { Check, Plus, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { TaskAssignee } from "../utils/cards";
import { CustomScrollArea } from "./CustomScrollArea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface AssigneePopoverProps {
  currentAssignee: TaskAssignee;
  onAssigneeChange: (assignee: TaskAssignee | null) => void;
  availableAssignees: TaskAssignee[];
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

export function AssigneePopover({
  currentAssignee,
  onAssigneeChange,
  availableAssignees,
}: AssigneePopoverProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  const isUnassigned = currentAssignee.userId === 0 || currentAssignee.name === "Unassigned";
  const idleSurfaceClassName = isDarkMode
    ? "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
    : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100";
  const visibleAssignees = useMemo(
    () =>
      availableAssignees
        .filter((assignee) => matchesAssigneeQuery(assignee, query))
        .slice(0, 2),
    [availableAssignees, query],
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSelectAssignee = (assignee: TaskAssignee) => {
    onAssigneeChange(assignee);
    setQuery("");
    setHighlightedIndex(0);
    setIsOpen(false);
  };

  const handleClear = () => {
    onAssigneeChange(null);
    setQuery("");
    setHighlightedIndex(0);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (visibleAssignees.length === 0) {
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

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setQuery("");
          setHighlightedIndex(0);
        }
        setIsOpen(open);
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Popover.Trigger asChild>
              <button
                type="button"
                className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  isUnassigned
                    ? `${currentTheme.textMuted} border ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-white hover:bg-slate-50"}`
                    : `text-white shadow-sm ring-1 ${isDarkMode ? "ring-zinc-600 hover:ring-zinc-500" : "ring-slate-200 hover:ring-slate-300"} hover:ring-2 hover:shadow-md`
                }`}
                style={isUnassigned ? undefined : { backgroundColor: currentAssignee.color }}
                aria-label={isUnassigned ? "Assign task" : `Assigned to ${currentAssignee.name}`}
              >
                {isUnassigned ? (
                  <Plus className="h-3.5 w-3.5" />
                ) : (
                  currentAssignee.name.charAt(0).toUpperCase()
                )}
              </button>
            </Popover.Trigger>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {isUnassigned ? "Assign task" : `Assigned to ${currentAssignee.name}`}
        </TooltipContent>
      </Tooltip>

      <Popover.Portal>
        <Popover.Content
          className={`z-50 w-72 overflow-hidden rounded-2xl border-2 p-3 shadow-2xl ${currentTheme.cardBg} ${currentTheme.border} animate-in fade-in zoom-in-95 duration-200`}
          sideOffset={8}
          align="start"
        >
          <div className="mb-3 px-1">
            <h4 className={`text-xs font-bold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
              Reassign task
            </h4>
          </div>

          <div className="relative mb-3">
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
                const nextMatches = availableAssignees
                  .filter((assignee) => matchesAssigneeQuery(assignee, nextQuery))
                  .slice(0, 2);
                setQuery(nextQuery);
                setHighlightedIndex(nextMatches.length > 0 ? 0 : -1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search members"
              className={`min-h-[44px] w-full rounded-xl border px-10 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 ${currentTheme.focus} ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text}`}
            />
          </div>

          <div className={`overflow-hidden rounded-xl border ${currentTheme.border}`}>
            {visibleAssignees.length === 0 ? (
              <div className={`px-4 py-4 text-sm ${currentTheme.textMuted}`}>
                No board members match your search.
              </div>
            ) : (
              <CustomScrollArea viewportClassName="max-h-40 py-1 pr-1">
                <div id={listboxId} role="listbox">
                  {visibleAssignees.map((assignee, index) => {
                    const isSelected = !isUnassigned && assignee.userId === currentAssignee.userId;
                    const isHighlighted = index === highlightedIndex;

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
                        {isSelected && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </CustomScrollArea>
            )}
          </div>

          <div className={`mt-3 border-t pt-3 ${currentTheme.border}`}>
            <button
              type="button"
              onClick={handleClear}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${idleSurfaceClassName}`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${isDarkMode ? "bg-zinc-700 text-zinc-300" : "bg-slate-200 text-slate-600"}`}>
                <X className="h-4 w-4" />
              </div>
              <span>Unassign</span>
            </button>
          </div>

          <Popover.Arrow
            className="fill-current"
            style={{ color: isDarkMode ? "#18181b" : "#ffffff" }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
