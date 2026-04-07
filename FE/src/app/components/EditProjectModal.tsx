import { X, User, Plus, Trash2, Users, Crown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Board } from "../utils/boards";
import { getUsers, ProjectUser } from "../utils/users";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
  onBoardUpdated: (boardId: number, updates: { name: string; description: string; memberUserIds: number[] }) => Promise<void>;
}

function getInitialProjectDraft(board: Board | null) {
  return {
    name: board?.name ?? "",
    description: board?.description ?? "",
    memberUserIds: board?.members.map((member) => member.userId) ?? [],
  };
}

export function EditProjectModal({ isOpen, onClose, board, onBoardUpdated }: EditProjectModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const initialDraft = getInitialProjectDraft(board);

  const [name, setName] = useState(initialDraft.name);
  const [description, setDescription] = useState(initialDraft.description);
  const [memberUserIds, setMemberUserIds] = useState<number[]>(initialDraft.memberUserIds);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [availableUsers, setAvailableUsers] = useState<ProjectUser[]>([]);
  const [showError, setShowError] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setShowError(false);
    setSubmitError("");
    setSelectedUserId("");
    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    let isActive = true;

    const loadUsers = async () => {
      if (!isOpen) {
        return;
      }

      try {
        const users = await getUsers();
        if (!isActive) {
          return;
        }

        setAvailableUsers(users);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unable to load users.";
        setSubmitError(message);
      }
    };

    void loadUsers();

    return () => {
      isActive = false;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setShowError(false);
        setSubmitError("");
        setSelectedUserId("");
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
    () => {
      if (!board) {
        return [];
      }

      return memberUserIds
        .map((userId) => {
          const existingMember = board.members.find((member) => member.userId === userId);
          if (existingMember) {
            return existingMember;
          }

          const user = availableUsers.find((candidate) => candidate.id === userId);
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
        .filter((member): member is NonNullable<typeof member> => member !== null);
    },
    [availableUsers, board, memberUserIds],
  );

  const remainingUsers = useMemo(
    () => availableUsers.filter((user) => !memberUserIds.includes(user.id)),
    [availableUsers, memberUserIds],
  );

  if (!isOpen || !board) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setShowError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      await onBoardUpdated(board.id, {
        name: name.trim(),
        description: description.trim(),
        memberUserIds,
      });

      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save project changes.";
      setSubmitError(message);
      setIsSubmitting(false);
    }
  };

  const handleAddMember = () => {
    if (!selectedUserId) return;

    setMemberUserIds((prev) => [...prev, selectedUserId]);
    setSelectedUserId("");
  };

  const handleRemoveMember = (userId: number) => {
    if (!board) {
      return;
    }

    const member = board.members.find((item) => item.userId === userId);
    if (member?.role === "owner") {
      return;
    }

    setMemberUserIds((prev) => prev.filter((memberId) => memberId !== userId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddMember();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className={`relative ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full max-w-2xl mx-4 border-2 ${currentTheme.border} animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b-2 ${currentTheme.border} ${currentTheme.cardBg} rounded-t-3xl`}>
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Edit Project</h2>
          <button
            onClick={handleClose}
            className={`${currentTheme.textMuted} hover:${currentTheme.textSecondary} transition-colors hover:${currentTheme.bgSecondary} rounded-full p-2`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

            <div className="flex gap-2 mb-4">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : "")}
                onKeyDown={handleKeyDown}
                className={`flex-1 px-4 py-2.5 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
              >
                <option value="">{remainingUsers.length === 0 ? "No more users to add" : "Select a user"}</option>
                {remainingUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddMember}
                disabled={!selectedUserId}
                className={`px-4 py-2.5 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className={`${currentTheme.bgSecondary} rounded-xl p-4 max-h-60 overflow-y-auto`}>
              {members.length === 0 ? (
                <div className={`text-center py-6 ${currentTheme.textMuted}`}>
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No members yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const isOwner = member.role === "owner";

                    return (
                      <div
                        key={member.userId}
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
                            <div className="flex items-center gap-1.5">
                              {isOwner && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                              <p className={`text-xs ${currentTheme.textMuted}`}>{isOwner ? "Owner" : "Team Member"}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={isOwner}
                          className={`p-2 rounded-lg transition-all ${
                            isOwner
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-red-50 dark:hover:bg-red-950 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                          }`}
                          title={isOwner ? "Project owner cannot be removed" : "Remove member"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

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
              disabled={isSubmitting}
              className={`flex-1 px-5 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
