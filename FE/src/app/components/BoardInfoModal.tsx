import { X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { Board } from "../utils/boards";
import { BoardMemberListItem } from "./BoardMemberListItem";
import { BoardLogo } from "./BoardLogo";
import { CustomScrollArea } from "./CustomScrollArea";

interface BoardInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
}

function formatBoardCreatedAt(createdAt: string): string {
  const parsedDate = new Date(createdAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return createdAt;
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(parsedDate);
}

export function BoardInfoModal({ isOpen, onClose, board }: BoardInfoModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const detailSurfaceClassName = `${isDarkMode ? currentTheme.inputBg : "bg-gray-50"} ${currentTheme.border}`;
  const memberSurfaceClassName = isDarkMode ? currentTheme.bgSecondary : "bg-gray-50";

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const createdAtLabel = useMemo(
    () => (board ? formatBoardCreatedAt(board.createdAt) : ""),
    [board],
  );

  if (!isOpen || !board) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative ${currentTheme.cardBg} mx-4 flex w-full max-w-2xl animate-in zoom-in-95 flex-col overflow-hidden rounded-3xl border-2 ${currentTheme.border} shadow-2xl duration-200`}
        style={{ height: "min(88vh, 44rem)" }}
      >
        <div className={`flex items-center justify-between border-b-2 ${currentTheme.border} px-8 py-6 shrink-0`}>
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Details</h2>
          <button
            type="button"
            onClick={onClose}
            className={`${currentTheme.textMuted} rounded-full p-2 transition-colors hover:${currentTheme.textSecondary} hover:${currentTheme.bgSecondary}`}
            aria-label="Close board details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden px-8 py-6">
          <CustomScrollArea className="h-full min-h-0" viewportClassName="h-full min-h-0 pr-4">
            <div className="space-y-6 px-1 py-1">
              <div className={`flex items-start gap-4 rounded-2xl border ${detailSurfaceClassName} px-5 py-5`}>
                <BoardLogo
                  iconKey={board.logoIconKey}
                  colorKey={board.logoColorKey}
                  size="lg"
                />
                <div className="min-w-0 space-y-2">
                  <h3 className={`break-words text-2xl font-bold leading-tight ${currentTheme.text}`}>
                    {board.name}
                  </h3>
                </div>
              </div>

              <section className="space-y-3">
                <h4 className={`text-sm font-semibold uppercase tracking-[0.16em] ${currentTheme.textSecondary}`}>
                  Description
                </h4>
                <div className={`rounded-2xl border ${detailSurfaceClassName} px-5 py-4`}>
                  {board.description?.trim() ? (
                    <p
                      className={`whitespace-pre-wrap break-words text-sm leading-7 ${currentTheme.textSecondary}`}
                      style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                    >
                      {board.description}
                    </p>
                  ) : (
                    <p className={`text-sm italic ${currentTheme.textMuted}`}>No description provided.</p>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h4 className={`text-sm font-semibold uppercase tracking-[0.16em] ${currentTheme.textSecondary}`}>
                  Created
                </h4>
                <div className={`rounded-2xl border ${detailSurfaceClassName} px-5 py-4`}>
                  <p className={`break-words text-sm leading-7 ${currentTheme.textSecondary}`}>
                    {createdAtLabel}
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className={`text-sm font-semibold uppercase tracking-[0.16em] ${currentTheme.textSecondary}`}>
                  Members
                </h4>
                <div className={`rounded-2xl border ${detailSurfaceClassName} px-4 py-4`}>
                  {board.members.length > 0 ? (
                    <div className="space-y-2">
                      {board.members.map((member) => (
                        <BoardMemberListItem
                          key={member.userId}
                          currentTheme={currentTheme}
                          displayName={member.name}
                          username={member.username}
                          email={member.email}
                          role={member.role}
                          surfaceClassName={memberSurfaceClassName}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className={`px-1 py-2 text-sm italic ${currentTheme.textMuted}`}>No members found.</p>
                  )}
                </div>
              </section>
            </div>
          </CustomScrollArea>
        </div>

        <div className={`shrink-0 border-t-2 ${currentTheme.border} px-8 py-6 ${currentTheme.cardBg}`}>
          <button
            type="button"
            onClick={onClose}
            className={`w-full rounded-xl bg-gradient-to-r ${currentTheme.primary} px-5 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
