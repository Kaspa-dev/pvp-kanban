import { Search, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { ProjectUser, searchUsers } from "../utils/users";
import { CustomScrollArea } from "./CustomScrollArea";

interface UserSearchPickerProps {
  excludedUserIds: number[];
  onSelectUser: (user: ProjectUser) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_RESULT_LIMIT = 8;

export function UserSearchPicker({
  excludedUserIds,
  onSelectUser,
  placeholder = "Search members by name, username, or email",
  disabled = false,
}: UserSearchPickerProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProjectUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);
  const excludedUserIdsRef = useRef<number[]>(excludedUserIds);
  const normalizedQuery = query.trim();

  const visibleResults = useMemo(
    () => results.filter((user) => !excludedUserIds.includes(user.id)),
    [excludedUserIds, results],
  );

  excludedUserIdsRef.current = excludedUserIds;

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
    setResults((previous) =>
      previous.filter((user) => !excludedUserIdsRef.current.includes(user.id)),
    );
  }, [excludedUserIds]);

  useEffect(() => {
    if (disabled) {
      setResults([]);
      setError("");
      setIsLoading(false);
      setIsOpen(false);
      setHighlightedIndex(0);
      return;
    }

    if (!normalizedQuery) {
      setResults([]);
      setError("");
      setIsLoading(false);
      setIsOpen(false);
      setHighlightedIndex(0);
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    setIsLoading(true);
    setError("");
    setIsOpen(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const nextResults = await searchUsers(normalizedQuery, SEARCH_RESULT_LIMIT);
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        const filteredResults = nextResults.filter(
          (user) => !excludedUserIdsRef.current.includes(user.id),
        );
        setResults(filteredResults);
        setHighlightedIndex(filteredResults.length > 0 ? 0 : -1);
      } catch (searchError) {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        const message =
          searchError instanceof Error ? searchError.message : "Unable to search users right now.";
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
  }, [disabled, normalizedQuery]);

  const handleSelectUser = (user: ProjectUser) => {
    onSelectUser(user);
    setQuery("");
    setResults([]);
    setError("");
    setIsOpen(false);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(0);
      return;
    }

    if (!isOpen || visibleResults.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((previous) => (previous + 1) % visibleResults.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((previous) =>
        previous <= 0 ? visibleResults.length - 1 : previous - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selectedUser = visibleResults[highlightedIndex] ?? visibleResults[0];
      if (selectedUser) {
        handleSelectUser(selectedUser);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(event.target.value.trim().length > 0);
          }}
          onFocus={() => {
            if (normalizedQuery) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-xl border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} py-3 pl-10 pr-10 transition-all focus:border-transparent focus:outline-none focus:ring-2 ${currentTheme.focus} disabled:cursor-not-allowed disabled:opacity-60`}
        />
        {isLoading && (
          <Loader2 className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin ${currentTheme.textMuted}`} />
        )}
      </div>

      {isOpen && normalizedQuery && (
        <div className={`mt-3 overflow-hidden rounded-2xl border ${currentTheme.border} ${currentTheme.cardBg} shadow-lg`}>
          {error ? (
            <div className="px-4 py-3 text-sm text-red-600">{error}</div>
          ) : !isLoading && visibleResults.length === 0 ? (
            <div className={`px-4 py-3 text-sm ${currentTheme.textMuted}`}>No users found.</div>
          ) : (
            <CustomScrollArea viewportClassName="max-h-64 py-2">
              <div className="-mr-3">
              {visibleResults.map((user, index) => {
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelectUser(user)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      isHighlighted
                        ? `${currentTheme.primaryBg} ${currentTheme.primaryText}`
                        : `${currentTheme.text} ${isDarkMode ? "hover:bg-zinc-800/80" : "hover:bg-slate-50"}`
                    }`}
                  >
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${currentTheme.primary} text-sm font-bold text-white`}>
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{user.displayName}</p>
                      <p className={`truncate text-xs ${isHighlighted ? "opacity-80" : currentTheme.textMuted}`}>
                        @{user.username} • {user.email}
                      </p>
                    </div>
                  </button>
                );
              })}
              </div>
            </CustomScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
