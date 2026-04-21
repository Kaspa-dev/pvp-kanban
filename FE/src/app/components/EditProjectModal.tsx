import { X, User, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Board } from "../utils/boards";
import {
  BoardLogoColorKey,
  BoardLogoIconKey,
  DEFAULT_BOARD_LOGO_COLOR_KEY,
  DEFAULT_BOARD_LOGO_ICON_KEY,
} from "../utils/boardIdentity";
import { ProjectUser } from "../utils/users";
import { BoardIdentityPicker } from "./BoardIdentityPicker";
import { BoardMemberListItem } from "./BoardMemberListItem";
import { CustomScrollArea } from "./CustomScrollArea";
import { UserSearchPicker } from "./UserSearchPicker";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getIconActionButtonClassName } from "./iconActionButtonStyles";
import {
  getPrimaryModalActionButtonClassName,
  getSecondaryModalActionButtonClassName,
} from "./modalActionButtonStyles";
import { showErrorToast, showSuccessToast } from "../utils/toast";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
  onBoardUpdated: (boardId: number, updates: {
    name: string;
    description: string;
    logoIconKey: BoardLogoIconKey;
    logoColorKey: BoardLogoColorKey;
    memberUserIds: number[];
  }) => Promise<void>;
}

const MAX_BOARD_MEMBERS = 20;
const MAX_BOARD_NAME_LENGTH = 128;
const MAX_BOARD_DESCRIPTION_LENGTH = 500;
const BOARD_DESCRIPTION_TEXTAREA_HEIGHT_CLASS = "min-h-24 max-h-48";

function getInitialProjectDraft(board: Board | null) {
  return {
    name: board?.name ?? "",
    description: board?.description ?? "",
    logoIconKey: board?.logoIconKey ?? DEFAULT_BOARD_LOGO_ICON_KEY,
    logoColorKey: board?.logoColorKey ?? DEFAULT_BOARD_LOGO_COLOR_KEY,
    memberUserIds: board?.members.map((member) => member.userId) ?? [],
  };
}

function getInitialMemberDirectory(board: Board | null): Record<number, ProjectUser> {
  if (!board) {
    return {};
  }

  return board.members.reduce<Record<number, ProjectUser>>((accumulator, member) => {
    accumulator[member.userId] = {
      id: member.userId,
      username: member.username,
      displayName: member.displayName,
      email: member.email,
    };

    return accumulator;
  }, {});
}

export function EditProjectModal({ isOpen, onClose, board, onBoardUpdated }: EditProjectModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const modalFieldSurfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-gray-50";
  const modalSecondarySurfaceClassName = isDarkMode ? currentTheme.bgSecondary : "bg-gray-50";
  const primaryActionButtonClassName = getPrimaryModalActionButtonClassName(currentTheme);
  const secondaryActionButtonClassName = getSecondaryModalActionButtonClassName(
    currentTheme,
    currentTheme.text,
  );
  const initialDraft = getInitialProjectDraft(board);
  const initialDirectory = getInitialMemberDirectory(board);

  const [name, setName] = useState(initialDraft.name);
  const [description, setDescription] = useState(initialDraft.description);
  const [logoIconKey, setLogoIconKey] = useState<BoardLogoIconKey>(initialDraft.logoIconKey);
  const [logoColorKey, setLogoColorKey] = useState<BoardLogoColorKey>(initialDraft.logoColorKey);
  const [memberUserIds, setMemberUserIds] = useState<number[]>(initialDraft.memberUserIds);
  const [memberDirectory, setMemberDirectory] = useState<Record<number, ProjectUser>>(initialDirectory);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const memberActionButtonClassName = getIconActionButtonClassName(currentTheme);

  const handleClose = () => {
    setShowError(false);
    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setShowError(false);
        setIsSubmitting(false);
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

  const members = useMemo(
    () =>
      memberUserIds
        .map((userId) => {
          const existingMember = board?.members.find((member) => member.userId === userId);
          if (existingMember) {
            return existingMember;
          }

          const user = memberDirectory[userId];
          if (!user) {
            return null;
          }

          return {
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            color: "#64748b",
            role: "member" as const,
            name: user.displayName,
          };
        })
        .filter((member): member is NonNullable<typeof member> => member !== null),
    [board, memberDirectory, memberUserIds],
  );
  const totalMemberCount = members.length;
  const hasReachedMemberLimit = totalMemberCount >= MAX_BOARD_MEMBERS;

  if (!isOpen || !board) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setShowError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await onBoardUpdated(board.id, {
        name: name.trim(),
        description: description.trim(),
        logoIconKey,
        logoColorKey,
        memberUserIds,
      });

      showSuccessToast("Project changes saved.");
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save project changes.";
      showErrorToast(message);
      setIsSubmitting(false);
    }
  };

  const handleAddMember = (projectUser: ProjectUser) => {
    if (hasReachedMemberLimit) {
      return;
    }

    setMemberDirectory((previous) => ({
      ...previous,
      [projectUser.id]: projectUser,
    }));
    setMemberUserIds((previous) =>
      previous.includes(projectUser.id) ? previous : [...previous, projectUser.id],
    );
  };

  const handleRemoveMember = (userId: number) => {
    const member = board.members.find((item) => item.userId === userId);
    if (member?.role === "owner") {
      return;
    }

    setMemberUserIds((previous) => previous.filter((memberId) => memberId !== userId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className={`relative ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full max-w-2xl mx-4 border-2 ${currentTheme.border} animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col`}
        style={{ height: "min(90vh, 52rem)" }}
      >
        <div className={`z-10 flex items-center justify-between p-6 border-b-2 ${currentTheme.border} ${currentTheme.cardBg} rounded-t-3xl shrink-0`}>
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Edit Project</h2>
          <button
            type="button"
            onClick={handleClose}
            className={`${currentTheme.textMuted} hover:${currentTheme.textSecondary} transition-colors hover:${currentTheme.bgSecondary} rounded-full p-2`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden px-6 py-6">
            <CustomScrollArea
              className="h-full min-h-0"
              viewportClassName="h-full min-h-0 pr-4"
            >
              <div className="space-y-6 px-1 py-1">
              <div>
                <label htmlFor="name" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (showError && event.target.value.trim()) {
                      setShowError(false);
                    }
                  }}
                  maxLength={MAX_BOARD_NAME_LENGTH}
                  placeholder="Enter project name..."
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-[border-color,box-shadow,color,background-color] duration-300 ease-out focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent ${modalFieldSurfaceClassName} ${currentTheme.text} ${
                    showError && !name.trim() ? "border-red-500" : currentTheme.inputBorder
                  }`}
                  autoFocus
                />
                <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
                  Up to {MAX_BOARD_NAME_LENGTH} characters.
                </p>
                {showError && !name.trim() && (
                  <p className="text-red-500 text-sm mt-1">Project name is required</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
                  Description <span className={`${currentTheme.textMuted} font-normal`}>(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={MAX_BOARD_DESCRIPTION_LENGTH}
                  placeholder="Describe your project..."
                  rows={4}
                  className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl transition-[border-color,box-shadow,color,background-color] duration-300 ease-out focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent resize-y ${BOARD_DESCRIPTION_TEXTAREA_HEIGHT_CLASS} ${modalFieldSurfaceClassName} ${currentTheme.text}`}
                />
                <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
                  Up to {MAX_BOARD_DESCRIPTION_LENGTH} characters.
                </p>
              </div>

              <BoardIdentityPicker
                iconKey={logoIconKey}
                colorKey={logoColorKey}
                onIconChange={setLogoIconKey}
                onColorChange={setLogoColorKey}
              />

              <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className={`w-4 h-4 ${currentTheme.textSecondary}`} />
                <label className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
                    Team Members
                  </label>
                  <span className={`text-xs ${currentTheme.textMuted}`}>
                  ({members.length} member{members.length !== 1 ? 's' : ''})
                </span>
              </div>

              <UserSearchPicker
                excludedUserIds={memberUserIds}
                onSelectUser={handleAddMember}
                disabled={hasReachedMemberLimit}
                placeholder={
                  hasReachedMemberLimit
                    ? "Member limit reached"
                    : "Search members by name, username, or email"
                }
              />

              <p className={`mt-3 text-sm ${currentTheme.textMuted}`}>
                Boards can have up to {MAX_BOARD_MEMBERS} members total. This board is currently using {totalMemberCount} of {MAX_BOARD_MEMBERS}.
              </p>

                {members.length === 0 ? (
                  <div className={`mt-4 rounded-xl border ${currentTheme.border} ${modalSecondarySurfaceClassName} py-6 text-center ${currentTheme.textMuted}`}>
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No members yet.</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {members.map((member) => {
                      const isOwner = member.role === "owner";

                      return (
                        <BoardMemberListItem
                          key={member.userId}
                          currentTheme={currentTheme}
                          displayName={member.name}
                          username={member.username}
                          role={member.role}
                          surfaceClassName={modalSecondarySurfaceClassName}
                          hoverBorderClassName={`transition-all hover:${currentTheme.primaryBorder}`}
                          action={!isOwner ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member.userId)}
                                  className={memberActionButtonClassName}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={8}>Remove member</TooltipContent>
                            </Tooltip>
                          ) : undefined}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              </div>
            </CustomScrollArea>
          </div>

          <div className={`flex gap-3 p-6 border-t-2 ${currentTheme.border} ${currentTheme.cardBg} shrink-0`}>
            <button
              type="button"
              onClick={handleClose}
              className={`flex-1 px-5 py-3 font-semibold ${secondaryActionButtonClassName}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-5 py-3 font-semibold ${primaryActionButtonClassName}`}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
