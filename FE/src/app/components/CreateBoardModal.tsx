import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { createBoard, Board, BoardMember } from '../utils/boards';
import { createDefaultCards, saveBoardCards } from '../utils/cards';
import { createDefaultLabels } from '../utils/labels';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardCreated: (board: Board) => void;
}

const AVAILABLE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#ef4444", // red
  "#84cc16", // lime
];

export function CreateBoardModal({ isOpen, onClose, onBoardCreated }: CreateBoardModalProps) {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const [boardName, setBoardName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [errors, setErrors] = useState<{ name?: string; members?: string }>({});

  const resetForm = () => {
    setBoardName('');
    setDescription('');
    setMembers([]);
    setNewMemberName('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getRandomColor = () => {
    return AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)];
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;

    const member: BoardMember = {
      name: newMemberName.trim(),
      color: getRandomColor(),
    };

    setMembers([...members, member]);
    setNewMemberName('');
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: { name?: string; members?: string } = {};

    if (!boardName.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (members.length === 0 && user) {
      // Auto-add current user if no members
      setMembers([{ name: user.displayName, color: getRandomColor() }]);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm() || !user) return;

    // Ensure current user is in members
    const finalMembers = finalMembersWithCurrentUser();

    const newBoard = createBoard(user.id, boardName.trim(), description.trim(), finalMembers);
    
    // Create default labels for the new board
    const defaultLabels = createDefaultLabels(newBoard.id);
    
    // Create label map for default cards
    const labelMap: { [key: string]: string } = {};
    defaultLabels.forEach(label => {
      labelMap[label.name] = label.id;
    });
    
    // Create default demo cards for the new board with proper label IDs
    const defaultCards = createDefaultCards(user.displayName, labelMap);
    saveBoardCards(newBoard.id, defaultCards);

    onBoardCreated(newBoard);
    handleClose();
  };

  const finalMembersWithCurrentUser = () => {
    if (!user) {
      return [...members];
    }

    if (members.some((member) => member.name === user.displayName)) {
      return [...members];
    }

    return [{ name: user.displayName, color: getRandomColor() }, ...members];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${currentTheme.cardBg} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 ${currentTheme.cardBg} border-b-2 ${currentTheme.border} px-6 py-4 flex items-center justify-between rounded-t-2xl`}>
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Create New Project</h2>
          <button
            onClick={handleClose}
            className={`p-2 hover:${currentTheme.bgSecondary} rounded-xl transition-colors`}
          >
            <X className={`w-5 h-5 ${currentTheme.textMuted}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Name */}
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

          {/* Description */}
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

          {/* Team Members */}
          <div>
            <label className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Team Members
            </label>
            
            {/* Add Member Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                placeholder="Enter member name"
                className={`flex-1 px-4 py-2 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
              />
              <button
                onClick={handleAddMember}
                className={`px-4 py-2 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl hover:scale-105 transition-all flex items-center gap-2`}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Members List */}
            {members.length > 0 && (
              <div className="space-y-2">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 ${currentTheme.bgSecondary} rounded-xl`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`flex-1 font-medium ${currentTheme.text}`}>{member.name}</span>
                    <button
                      onClick={() => handleRemoveMember(index)}
                      className={`p-2 hover:${currentTheme.bgTertiary} rounded-lg transition-colors`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {members.length === 0 && (
              <p className={`text-sm ${currentTheme.textMuted} italic`}>
                No members added yet. You'll be added automatically.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 ${currentTheme.bgSecondary} border-t-2 ${currentTheme.border} px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl`}>
          <button
            onClick={handleClose}
            className={`px-6 py-2.5 border-2 ${currentTheme.border} ${currentTheme.textSecondary} font-semibold rounded-xl hover:${currentTheme.bgTertiary} transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className={`px-6 py-2.5 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg`}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
