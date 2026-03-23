import { X, User, Plus, Trash2, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Board, BoardMember } from "../utils/boards";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
  onBoardUpdated: (boardId: string, updates: { name: string; description: string; members: BoardMember[] }) => void;
}

const MEMBER_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export function EditProjectModal({ isOpen, onClose, board, onBoardUpdated }: EditProjectModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (board && isOpen) {
      setName(board.name);
      setDescription(board.description);
      setMembers([...board.members]);
      setShowError(false);
      setNewMemberName("");
    }
  }, [board, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
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
  }, [isOpen]);

  if (!isOpen || !board) return null;

  const handleClose = () => {
    setShowError(false);
    setNewMemberName("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setShowError(true);
      return;
    }

    if (members.length === 0) {
      setShowError(true);
      return;
    }

    onBoardUpdated(board.id, {
      name: name.trim(),
      description: description.trim(),
      members,
    });

    handleClose();
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;

    const randomColor = MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)];
    const newMember: BoardMember = {
      name: newMemberName.trim(),
      color: randomColor,
    };

    setMembers([...members, newMember]);
    setNewMemberName("");
  };

  const handleRemoveMember = (index: number) => {
    if (members.length === 1) {
      // Don't allow removing the last member
      return;
    }
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddMember();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`relative ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full max-w-2xl mx-4 border-2 ${currentTheme.border} animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b-2 ${currentTheme.border} ${currentTheme.cardBg} rounded-t-3xl">
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Edit Project ✏️</h2>
          <button
            onClick={handleClose}
            className={`${currentTheme.textMuted} hover:${currentTheme.textSecondary} transition-colors hover:${currentTheme.bgSecondary} rounded-full p-2`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (showError && e.target.value.trim()) {
                  setShowError(false);
                }
              }}
              placeholder="Enter project name..."
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text} ${
                showError && !name.trim() ? "border-red-500" : currentTheme.inputBorder
              }`}
              autoFocus
            />
            {showError && !name.trim() && (
              <p className="text-red-500 text-sm mt-1">Project name is required</p>
            )}
          </div>

          {/* Project Description */}
          <div>
            <label htmlFor="description" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Description <span className={`${currentTheme.textMuted} font-normal`}>(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project..."
              rows={4}
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent resize-y transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
            />
          </div>

          {/* Members Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className={`w-4 h-4 ${currentTheme.textSecondary}`} />
              <label className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
                Team Members <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${currentTheme.textMuted}`}>
                ({members.length} member{members.length !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Add Member Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a team member..."
                className={`flex-1 px-4 py-2.5 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
              />
              <button
                type="button"
                onClick={handleAddMember}
                disabled={!newMemberName.trim()}
                className={`px-4 py-2.5 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-md`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Members List */}
            <div className={`${currentTheme.bgSecondary} rounded-xl p-4 max-h-60 overflow-y-auto`}>
              {members.length === 0 ? (
                <div className={`text-center py-6 ${currentTheme.textMuted}`}>
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No members yet. Add your team members above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 ${currentTheme.cardBg} rounded-lg border ${currentTheme.border} group hover:border-red-400 transition-all`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-semibold ${currentTheme.text}`}>{member.name}</p>
                          <p className={`text-xs ${currentTheme.textMuted}`}>Team Member</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                        disabled={members.length === 1}
                        className={`p-2 rounded-lg transition-all ${
                          members.length === 1
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:bg-red-50 dark:hover:bg-red-950 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                        }`}
                        title={members.length === 1 ? "Cannot remove the last member" : "Remove member"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {showError && members.length === 0 && (
              <p className="text-red-500 text-sm mt-2">At least one member is required</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className={`flex-1 px-5 py-3 border-2 ${currentTheme.border} ${currentTheme.text} font-semibold rounded-xl hover:${currentTheme.bgSecondary} transition-all hover:scale-105`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-5 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl hover:${currentTheme.primaryHover} transition-all hover:scale-105 shadow-lg`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}