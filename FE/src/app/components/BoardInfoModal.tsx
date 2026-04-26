import { Fingerprint, HelpCircle, User, Users } from "lucide-react";
import { useMemo } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { Board } from "../utils/boards";
import { BoardMemberListItem } from "./BoardMemberListItem";
import { BoardLogo } from "./BoardLogo";
import { FormModalFrame } from "./FormModalFrame";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

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

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getUTCDate()).padStart(2, "0");
  const hours = String(parsedDate.getUTCHours()).padStart(2, "0");
  const minutes = String(parsedDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(parsedDate.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

export function BoardInfoModal({ isOpen, onClose, board }: BoardInfoModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const modalFieldSurfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-gray-50";
  const modalSecondarySurfaceClassName = isDarkMode ? currentTheme.bgSecondary : "bg-gray-50";
  const sectionTitleClassName = `text-lg font-semibold ${currentTheme.text}`;
  const sectionDescriptionClassName = `text-sm ${currentTheme.textMuted}`;
  const sectionLabelClassName = `text-sm font-semibold ${currentTheme.textSecondary}`;
  const helpIconButtonClassName = `inline-flex h-5 w-5 items-center justify-center rounded-full ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;
  const sectionDividerClassName = isDarkMode
    ? "h-px rounded-full bg-zinc-800"
    : "h-px rounded-full bg-gray-200";
  const readOnlyFieldClassName = `rounded-xl border-2 ${currentTheme.inputBorder} ${modalFieldSurfaceClassName} px-4 py-3`;
  const metadataSurfaceClassName = `rounded-2xl border ${currentTheme.border} ${modalSecondarySurfaceClassName}`;

  const createdAtLabel = useMemo(
    () => (board ? formatBoardCreatedAt(board.createdAt) : ""),
    [board],
  );

  if (!isOpen || !board) {
    return null;
  }

  return (
    <FormModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Details"
      titleAddon={(
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className={helpIconButtonClassName} aria-label="Board details help">
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            Review the board&apos;s identity, metadata, and member list without changing anything.
          </TooltipContent>
        </Tooltip>
      )}
      closeAriaLabel="Close board details"
      maxWidthClassName="max-w-2xl"
      height="min(88vh, 44rem)"
      viewportClassName="h-full min-h-0 pr-4"
      contentClassName="space-y-6 px-1 py-1"
      footer={(
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClose}
              className={`w-full rounded-xl bg-gradient-to-r ${currentTheme.primary} px-5 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105`}
            >
              Close
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>Close project details</TooltipContent>
        </Tooltip>
      )}
    >
      <section className="space-y-6" aria-labelledby="board-details-identity-heading">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Fingerprint className={`h-4 w-4 ${currentTheme.primaryText}`} />
            <h3 id="board-details-identity-heading" className={sectionTitleClassName}>
              Project identity
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className={helpIconButtonClassName} aria-label="Project identity details help">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                This section shows the board&apos;s name, description, logo, and creation timestamp exactly as stored.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className={sectionDescriptionClassName}>
            Review the project&apos;s visual identity and core details exactly as teammates see them across the workspace.
          </p>
        </div>

        <div className="flex justify-center py-1">
          <BoardLogo
            iconKey={board.logoIconKey}
            colorKey={board.logoColorKey}
            size="xl"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <h4 className={sectionLabelClassName}>
              Project Name
            </h4>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className={helpIconButtonClassName} aria-label="Project name details help">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                This is the primary label teammates see for the board in navigation and project lists.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={readOnlyFieldClassName}>
            <p
              className={`whitespace-normal break-words text-sm leading-7 ${currentTheme.text}`}
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              {board.name}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <h4 className={sectionLabelClassName}>
              Description
            </h4>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className={helpIconButtonClassName} aria-label="Project description details help">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                The description gives extra context about the board&apos;s focus when teammates open its details.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={readOnlyFieldClassName}>
            {board.description?.trim() ? (
              <p
                className={`whitespace-pre-wrap break-words text-sm leading-7 ${currentTheme.text}`}
                style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
              >
                {board.description}
              </p>
            ) : (
              <p className={`text-sm italic leading-7 ${currentTheme.textMuted}`}>No description provided.</p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <h4 className={sectionLabelClassName}>
              Created at
            </h4>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className={helpIconButtonClassName} aria-label="Created at details help">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                This timestamp shows when the board was first created, stored in UTC.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={`${metadataSurfaceClassName} px-4 py-3`}>
            <p className={`break-words text-sm leading-7 ${currentTheme.text}`}>
              {createdAtLabel}
            </p>
          </div>
        </div>
      </section>

      <div className={`-mx-1 ${sectionDividerClassName}`} aria-hidden="true" />

      <section className="space-y-4" aria-labelledby="board-details-members-heading">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className={`h-4 w-4 ${currentTheme.primaryText}`} />
            <h3 id="board-details-members-heading" className={sectionTitleClassName}>
              Members
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className={helpIconButtonClassName} aria-label="Members details help">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                The member list shows who currently has access to the board and which users are owners.
              </TooltipContent>
            </Tooltip>
            <span className={`text-xs font-medium ${currentTheme.primaryText}`}>
              ({board.members.length} member{board.members.length !== 1 ? "s" : ""})
            </span>
          </div>
          <p className={sectionDescriptionClassName}>
            Everyone who currently has access to this project is listed below, including ownership roles.
          </p>
        </div>
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
                surfaceClassName={modalSecondarySurfaceClassName}
                hoverBorderClassName={`transition-all hover:${currentTheme.primaryBorder}`}
              />
            ))}
          </div>
        ) : (
          <div className={`rounded-xl border ${currentTheme.border} ${modalSecondarySurfaceClassName} py-6 text-center ${currentTheme.textMuted}`}>
            <User className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No members found.</p>
          </div>
        )}
      </section>
    </FormModalFrame>
  );
}
