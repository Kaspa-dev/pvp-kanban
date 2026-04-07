import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { createBoard, Board } from '../utils/boards';
import { getUsers, ProjectUser } from '../utils/users';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardCreated: (board: Board) => void;
}

export function CreateBoardModal({ isOpen, onClose, onBoardCreated }: CreateBoardModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const [boardName, setBoardName] = useState('');
  const [description, setDescription] = useState('');
  const [memberUserIds, setMemberUserIds] = useState<number[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [availableUsers, setAvailableUsers] = useState<ProjectUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; submit?: string }>({});

  useEffect(() => {
    let isActive = true;

    const loadUsers = async () => {
      if (!isOpen) {
        return;
      }

      try {
        setIsLoadingUsers(true);
        const users = await getUsers();
        if (!isActive) {
          return;
        }

        setAvailableUsers(users);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load users.';
        setErrors((prev) => ({ ...prev, submit: message }));
      } finally {
        if (isActive) {
          setIsLoadingUsers(false);
        }
      }
    };

    void loadUsers();

    return () => {
      isActive = false;
    };
  }, [isOpen]);

  const selectedMembers = useMemo(
    () => availableUsers.filter((user) => memberUserIds.includes(user.id)),
    [availableUsers, memberUserIds],
  );

  const remainingUsers = useMemo(
    () => availableUsers.filter((user) => !memberUserIds.includes(user.id)),
    [availableUsers, memberUserIds],
  );

  const resetForm = () => {
    setBoardName('');
    setDescription('');
    setMemberUserIds([]);
    setSelectedUserId('');
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddMember = () => {
    if (!selectedUserId) return;

    setMemberUserIds((prev) => [...prev, selectedUserId]);
    setSelectedUserId('');
  };

  const handleRemoveMember = (userId: number) => {
    setMemberUserIds((prev) => prev.filter((memberId) => memberId !== userId));
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
      setErrors((prev) => ({ ...prev, submit: undefined }));

      const newBoard = await createBoard(boardName.trim(), description.trim(), memberUserIds);
      onBoardCreated(newBoard);
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create the project.';
      setErrors((prev) => ({ ...prev, submit: message }));
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${currentTheme.cardBg} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 ${currentTheme.cardBg} border-b-2 ${currentTheme.border} px-6 py-4 flex items-center justify-between rounded-t-2xl`}>
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Create New Project</h2>
          <button
            onClick={handleClose}
            className={`p-2 hover:${currentTheme.bgSecondary} rounded-xl transition-colors`}
          >
            <X className={`w-5 h-5 ${currentTheme.textMuted}`} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="boardName" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Project Name *
            </label>
            <input
              id="boardName"
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="e.g., Website Redesign, Q1 Marketing Campaign"
              className={`w-full px-4 py-3 border-2 ${
                errors.name ? 'border-red-300' : currentTheme.inputBorder
              } rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
            />
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
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this project is about..."
              rows={3}
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all resize-none ${currentTheme.inputBg} ${currentTheme.text}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Team Members
            </label>

            <div className="flex gap-2 mb-3">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                disabled={isLoadingUsers || remainingUsers.length === 0}
                className={`flex-1 px-4 py-2 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
              >
                <option value="">
                  {isLoadingUsers ? 'Loading users...' : remainingUsers.length === 0 ? 'No more users to add' : 'Select a user'}
                </option>
                {remainingUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedUserId}
                className={`px-4 py-2 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-3 ${currentTheme.bgSecondary} rounded-xl`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: '#64748b' }}
                    >
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <span className={`font-medium ${currentTheme.text}`}>{member.displayName}</span>
                      <p className={`text-xs ${currentTheme.textMuted}`}>{member.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className={`p-2 hover:${currentTheme.bgTertiary} rounded-lg transition-colors`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedMembers.length === 0 && (
              <p className={`text-sm ${currentTheme.textMuted} italic`}>
                You&apos;ll be added automatically as the project owner. Add any extra registered users here.
              </p>
            )}
          </div>

          {errors.submit && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.submit}
            </div>
          )}
        </div>

        <div className={`sticky bottom-0 ${currentTheme.bgSecondary} border-t-2 ${currentTheme.border} px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl`}>
          <button
            onClick={handleClose}
            className={`px-6 py-2.5 border-2 ${currentTheme.border} ${currentTheme.textSecondary} font-semibold rounded-xl hover:${currentTheme.bgTertiary} transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={() => void handleCreate()}
            disabled={isSubmitting}
            className={`px-6 py-2.5 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
