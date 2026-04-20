import { useMemo, useState } from 'react';
import { X, Trash2, Users } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { getIconActionButtonClassName } from './iconActionButtonStyles';
import {
  getPrimaryModalActionButtonClassName,
  getSecondaryModalActionButtonClassName,
} from './modalActionButtonStyles';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardCreated: (board: Board) => void;
}

const MAX_BOARD_MEMBERS = 20;
const MAX_BOARD_NAME_LENGTH = 128;
const MAX_BOARD_DESCRIPTION_LENGTH = 500;

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

  const [boardName, setBoardName] = useState('');
  const [description, setDescription] = useState('');
  const [logoIconKey, setLogoIconKey] = useState<BoardLogoIconKey>(DEFAULT_BOARD_LOGO_ICON_KEY);
  const [logoColorKey, setLogoColorKey] = useState<BoardLogoColorKey>(DEFAULT_BOARD_LOGO_COLOR_KEY);
  const [memberUserIds, setMemberUserIds] = useState<number[]>([]);
  const [memberDirectory, setMemberDirectory] = useState<Record<number, ProjectUser>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; submit?: string }>({});
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
    const newErrors: { name?: string; submit?: string } = {};

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
      setErrors((previous) => ({ ...previous, submit: undefined }));

      const newBoard = await createBoard(
        boardName.trim(),
        description.trim(),
        logoIconKey,
        logoColorKey,
        memberUserIds,
      );
      onBoardCreated(newBoard);
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create the project.';
      setErrors((previous) => ({ ...previous, submit: message }));
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
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Create New Project</h2>
          <button
            type="button"
            onClick={handleClose}
            className={`p-2 hover:${currentTheme.bgSecondary} rounded-xl transition-colors`}
          >
            <X className={`w-5 h-5 ${currentTheme.textMuted}`} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden px-6 py-6">
          <CustomScrollArea
            className="h-full min-h-0"
            viewportClassName="h-full min-h-0 pr-4"
          >
            <div className="space-y-6 px-1 py-1">
            <div>
              <label htmlFor="boardName" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
                Project Name *
              </label>
              <input
                id="boardName"
                type="text"
                value={boardName}
                onChange={(event) => setBoardName(event.target.value)}
                maxLength={MAX_BOARD_NAME_LENGTH}
                placeholder="e.g., Website Redesign, Q1 Marketing Campaign"
                className={`w-full px-4 py-3 border-2 ${
                  errors.name ? 'border-red-300' : currentTheme.inputBorder
                } rounded-xl transition-[border-color,box-shadow,color,background-color] duration-300 ease-out focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent ${modalFieldSurfaceClassName} ${currentTheme.text}`}
              />
              <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
                Up to {MAX_BOARD_NAME_LENGTH} characters.
              </p>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={MAX_BOARD_DESCRIPTION_LENGTH}
                placeholder="Brief description of what this project is about..."
                rows={3}
                className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl transition-[border-color,box-shadow,color,background-color] duration-300 ease-out focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent resize-none ${modalFieldSurfaceClassName} ${currentTheme.text}`}
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

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className={`w-4 h-4 ${currentTheme.textSecondary}`} />
                <label className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
                  Team Members
                </label>
                <span className={`text-xs ${currentTheme.textMuted}`}>
                  ({selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''})
                </span>
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
            </div>

              {errors.submit && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errors.submit}
                </div>
              )}
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
