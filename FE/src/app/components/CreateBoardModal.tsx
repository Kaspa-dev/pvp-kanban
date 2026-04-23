import { useMemo, useState } from 'react';
import { Fingerprint, HelpCircle, X, Trash2, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { createBoard, Board } from '../utils/boards';
import {
  BoardLogoColorKey,
  BoardLogoIconKey,
  DEFAULT_BOARD_LOGO_COLOR_KEY,
  DEFAULT_BOARD_LOGO_ICON_KEY,
} from '../utils/boardIdentity';
import { ProjectUser } from '../utils/users';
import { BoardIdentityPicker } from './BoardIdentityPicker';
import { BoardMemberListItem } from './BoardMemberListItem';
import { CustomScrollArea } from './CustomScrollArea';
import { UserSearchPicker } from './UserSearchPicker';
import { UtilityIconButton } from './UtilityIconButton';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { getIconActionButtonClassName } from './iconActionButtonStyles';
import {
  getPrimaryModalActionButtonClassName,
  getSecondaryModalActionButtonClassName,
} from './modalActionButtonStyles';
import { showErrorToast, showSuccessToast } from '../utils/toast';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardCreated: (board: Board) => void;
}

const MAX_BOARD_MEMBERS = 20;
const MAX_BOARD_NAME_LENGTH = 128;
const MAX_BOARD_DESCRIPTION_LENGTH = 500;
const BOARD_DESCRIPTION_TEXTAREA_HEIGHT_CLASS = "min-h-24 max-h-48";

export function CreateBoardModal({ isOpen, onClose, onBoardCreated }: CreateBoardModalProps) {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const currentUserId = Number(user?.id ?? 0);
  const modalFieldSurfaceClassName = isDarkMode ? currentTheme.inputBg : 'bg-gray-50';
  const modalSecondarySurfaceClassName = isDarkMode ? currentTheme.bgSecondary : 'bg-gray-50';
  const primaryActionButtonClassName = getPrimaryModalActionButtonClassName(currentTheme);
  const secondaryActionButtonClassName = getSecondaryModalActionButtonClassName(
    currentTheme,
    currentTheme.textSecondary,
  );
  const sectionTitleClassName = `text-lg font-semibold ${currentTheme.text}`;
  const sectionDescriptionClassName = `text-sm ${currentTheme.textMuted}`;
  const helpIconButtonClassName = `inline-flex h-5 w-5 items-center justify-center rounded-full ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;
  const sectionDividerClassName = isDarkMode
    ? "h-px rounded-full bg-zinc-800"
    : "h-px rounded-full bg-gray-200";

  const [boardName, setBoardName] = useState('');
  const [description, setDescription] = useState('');
  const [logoIconKey, setLogoIconKey] = useState<BoardLogoIconKey>(DEFAULT_BOARD_LOGO_ICON_KEY);
  const [logoColorKey, setLogoColorKey] = useState<BoardLogoColorKey>(DEFAULT_BOARD_LOGO_COLOR_KEY);
  const [memberUserIds, setMemberUserIds] = useState<number[]>([]);
  const [memberDirectory, setMemberDirectory] = useState<Record<number, ProjectUser>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>(
    {},
  );
  const memberActionButtonClassName = getIconActionButtonClassName(currentTheme);

  const selectedMembers = useMemo(
    () =>
      memberUserIds
        .map((userId) => memberDirectory[userId])
        .filter((member): member is ProjectUser => Boolean(member)),
    [memberDirectory, memberUserIds],
  );
  const totalMemberCount = selectedMembers.length + 1;
  const hasReachedMemberLimit = totalMemberCount >= MAX_BOARD_MEMBERS;

  const resetForm = () => {
    setBoardName('');
    setDescription('');
    setLogoIconKey(DEFAULT_BOARD_LOGO_ICON_KEY);
    setLogoColorKey(DEFAULT_BOARD_LOGO_COLOR_KEY);
    setMemberUserIds([]);
    setMemberDirectory({});
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
    setMemberUserIds((previous) => previous.filter((memberId) => memberId !== userId));
  };

  const validateForm = () => {
    const newErrors: { name?: string } = {};

    if (!boardName.trim()) {
      newErrors.name = 'Project name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const newBoard = await createBoard(
        boardName.trim(),
        description.trim(),
        logoIconKey,
        logoColorKey,
        memberUserIds,
      );
      showSuccessToast("Project created successfully.");
      onBoardCreated(newBoard);
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create the project.';
      showErrorToast(message);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`${currentTheme.cardBg} rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col`}
        style={{ height: "min(90vh, 52rem)" }}
      >
        <div className={`${currentTheme.cardBg} border-b-2 ${currentTheme.border} px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0`}>
          <div className="flex items-center gap-2">
            <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Create New Project</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className={helpIconButtonClassName} aria-label="Create project modal help">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                Set up the project identity first, then invite teammates before you create it.
              </TooltipContent>
            </Tooltip>
          </div>
          <UtilityIconButton
            type="button"
            size="md"
            onClick={handleClose}
            aria-label="Close create project modal"
          >
            <X className="w-5 h-5" />
          </UtilityIconButton>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden px-6 py-6">
          <CustomScrollArea
            className="h-full min-h-0"
            viewportClassName="h-full min-h-0 pr-4"
          >
            <div className="space-y-6 px-1 py-1">
              <section className="space-y-6" aria-labelledby="create-project-identity-heading">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Fingerprint className={`h-4 w-4 ${currentTheme.primaryText}`} />
                    <h3 id="create-project-identity-heading" className={sectionTitleClassName}>
                      Define the project&apos;s identity
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className={helpIconButtonClassName} aria-label="Project identity help">
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>
                        The name, description, and visual identity help teammates recognize this board across the app.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className={sectionDescriptionClassName}>
                    Add the basics first, then choose the icon and color members will recognize across the app.
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <label htmlFor="boardName" className={`block text-sm font-semibold ${currentTheme.textSecondary}`}>
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className={helpIconButtonClassName} aria-label="Project name help">
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>
                        Pick a short, recognizable board name that teammates can scan quickly.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <input
                    id="boardName"
                    type="text"
                    value={boardName}
                    onChange={(event) => setBoardName(event.target.value)}
                    maxLength={MAX_BOARD_NAME_LENGTH}
                    placeholder="e.g., Website Redesign, Q1 Marketing Campaign"
                    className={`w-full px-4 py-3 border-2 ${
                      errors.name ? 'border-red-500' : currentTheme.inputBorder
                    } rounded-xl transition-[border-color,box-shadow,color,background-color] duration-300 ease-out focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent ${modalFieldSurfaceClassName} ${currentTheme.text}`}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-xs ${currentTheme.textMuted}`}>
                      Up to {MAX_BOARD_NAME_LENGTH} characters.
                    </p>
                    <span className={`text-xs ${currentTheme.textMuted}`}>
                      {boardName.trim().length}/{MAX_BOARD_NAME_LENGTH}
                    </span>
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <label htmlFor="description" className={`block text-sm font-semibold ${currentTheme.textSecondary}`}>
                      Description
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className={helpIconButtonClassName} aria-label="Project description help">
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>
                        Add context about the board&apos;s purpose, team, or workflow so members know what belongs here.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={MAX_BOARD_DESCRIPTION_LENGTH}
                    placeholder="Brief description of what this project is about..."
                    rows={3}
                    className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl transition-[border-color,box-shadow,color,background-color] duration-300 ease-out focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent resize-y ${BOARD_DESCRIPTION_TEXTAREA_HEIGHT_CLASS} ${modalFieldSurfaceClassName} ${currentTheme.text}`}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-xs ${currentTheme.textMuted}`}>
                      Up to {MAX_BOARD_DESCRIPTION_LENGTH} characters.
                    </p>
                    <span className={`text-xs ${currentTheme.textMuted}`}>
                      {description.trim().length}/{MAX_BOARD_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                </div>

                <BoardIdentityPicker
                  iconKey={logoIconKey}
                  colorKey={logoColorKey}
                  onIconChange={setLogoIconKey}
                  onColorChange={setLogoColorKey}
                />
              </section>

              <div className={`-mx-1 ${sectionDividerClassName}`} aria-hidden="true" />

              <section className="space-y-4" aria-labelledby="create-project-members-heading">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className={`w-4 h-4 ${currentTheme.primaryText}`} />
                    <h3 id="create-project-members-heading" className={sectionTitleClassName}>
                      Invite your team
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className={helpIconButtonClassName} aria-label="Invite team help">
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>
                        Add registered users now so they can access the board as soon as it&apos;s created.
                      </TooltipContent>
                    </Tooltip>
                    <span className={`text-xs font-medium ${currentTheme.primaryText}`}>
                      ({selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <p className={sectionDescriptionClassName}>
                    Search by name, username, or email to add people before you create the project.
                  </p>
                </div>

                <UserSearchPicker
                  excludedUserIds={[currentUserId, ...memberUserIds]}
                  onSelectUser={handleAddMember}
                  disabled={hasReachedMemberLimit}
                  placeholder={
                    hasReachedMemberLimit
                      ? "Member limit reached"
                      : "Search members by name, username, or email"
                  }
                />

                <p className={`mt-3 text-sm ${currentTheme.textMuted}`}>
                  Boards can have up to {MAX_BOARD_MEMBERS} members total, including you as the owner. Currently using {totalMemberCount} of {MAX_BOARD_MEMBERS}.
                </p>

                {selectedMembers.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {selectedMembers.map((member) => (
                      <BoardMemberListItem
                        key={member.id}
                        currentTheme={currentTheme}
                        displayName={member.displayName}
                        username={member.username}
                        email={member.email}
                        surfaceClassName={modalSecondarySurfaceClassName}
                        action={(
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member.id)}
                                className={memberActionButtonClassName}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>Remove member</TooltipContent>
                          </Tooltip>
                        )}
                      />
                    ))}
                  </div>
                ) : (
                  <p className={`mt-4 text-sm ${currentTheme.textMuted} italic`}>
                    You&apos;ll be added automatically as the project owner. Search and add any extra registered users here.
                  </p>
                )}
              </section>
            </div>
          </CustomScrollArea>
        </div>

        <div className={`flex gap-3 p-6 border-t-2 ${currentTheme.border} ${currentTheme.cardBg} rounded-b-2xl shrink-0`}>
          <button
            type="button"
            onClick={handleClose}
            className={`flex-1 px-5 py-3 font-semibold ${secondaryActionButtonClassName}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isSubmitting}
            className={`flex-1 px-5 py-3 font-semibold ${primaryActionButtonClassName}`}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
