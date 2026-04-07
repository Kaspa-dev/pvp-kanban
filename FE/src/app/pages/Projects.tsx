import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { getUserBoards, Board, updateBoard, deleteBoard, isBoardOwner } from '../utils/boards';
import { Plus, Folder, Calendar, CheckSquare, ArrowRight, Settings, LogOut, Edit3, Users, Trash2 } from 'lucide-react';
import { CreateBoardModal } from '../components/CreateBoardModal';
import { EditProjectModal } from '../components/EditProjectModal';
import { SettingsModal } from '../components/SettingsModal';
import { ConfirmDeleteProjectDialog } from '../components/ConfirmDeleteProjectDialog';
import { BanBanLogo } from '../components/BanBanLogo';

export function Projects() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadBoards = async () => {
      try {
        setIsLoadingBoards(true);
        setLoadError('');
        const loadedBoards = await getUserBoards();
        if (!isActive) {
          return;
        }

        setBoards(loadedBoards);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load projects right now.';
        setLoadError(message);
      } finally {
        if (isActive) {
          setIsLoadingBoards(false);
        }
      }
    };

    if (user) {
      void loadBoards();
    }

    return () => {
      isActive = false;
    };
  }, [user]);

  const handleBoardCreated = (newBoard: Board) => {
    setBoards((prevBoards) => [newBoard, ...prevBoards]);
  };

  const handleSelectBoard = (boardId: number) => {
    navigate(`/app/${boardId}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleEditBoard = (board: Board) => {
    setSelectedBoard(board);
    setIsEditModalOpen(true);
  };

  const handleBoardUpdated = async (
    boardId: number,
    updates: { name: string; description: string; memberUserIds: number[] },
  ) => {
    const updatedBoard = await updateBoard(boardId, updates);
    setBoards((prevBoards) =>
      prevBoards.map((board) => (board.id === boardId ? updatedBoard : board)),
    );
    setSelectedBoard(updatedBoard);
  };

  const handleDeleteBoard = async (boardId: number) => {
    await deleteBoard(boardId);
    setBoards((prevBoards) => prevBoards.filter((board) => board.id !== boardId));
  };

  if (!user) return null;

  return (
    <div className={`min-h-screen relative overflow-hidden ${currentTheme.bgSecondary}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br ${currentTheme.primarySoft} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: '8s' }} />
        <div className={`absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-tr ${currentTheme.primarySoft} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className={`absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-br ${currentTheme.primarySoft} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: '12s', animationDelay: '4s' }} />
      </div>

      <header className={`relative z-10 ${currentTheme.bg} border-b ${currentTheme.border} backdrop-blur-xl bg-opacity-90 dark:bg-opacity-90`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BanBanLogo size="lg" />
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-3 px-4 py-2 ${currentTheme.bgSecondary} rounded-xl border ${currentTheme.border}`}>
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center text-white font-bold shadow-md`}>
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={`font-semibold ${currentTheme.text} text-sm`}>{user.displayName}</p>
                <p className={`text-xs ${currentTheme.textMuted}`}>{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className={`p-3 rounded-xl transition-all cursor-pointer relative z-20 border ${
                isDarkMode
                  ? `border-transparent hover:${currentTheme.primaryBorder} text-gray-400 hover:text-gray-200 hover:shadow-sm`
                  : 'border-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`}
              title="Settings"
              type="button"
            >
              <Settings className="w-5 h-5 pointer-events-none" />
            </button>
            <button
              onClick={handleLogout}
              className={`p-3 rounded-xl transition-all border ${
                isDarkMode
                  ? 'border-transparent hover:border-red-500/50 hover:shadow-sm hover:shadow-red-500/10 text-red-400 hover:text-red-300'
                  : 'border-transparent hover:bg-red-50 text-red-500 hover:text-red-600'
              } focus:outline-none focus:ring-2 focus:ring-red-500/30`}
              title="Logout"
              type="button"
            >
              <LogOut className="w-5 h-5 pointer-events-none" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className={`${currentTheme.cardBg} rounded-3xl border ${currentTheme.border} p-10 mb-10 relative overflow-hidden shadow-lg`}>
          <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${currentTheme.primarySoftStrong} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: '6s' }} />
          <div className={`absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr ${currentTheme.primarySoft} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: '8s', animationDelay: '1s' }} />

          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
            backgroundImage: `linear-gradient(${isDarkMode ? '#fff' : '#000'} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? '#fff' : '#000'} 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />

          <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center shadow-lg`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className={`text-4xl font-bold ${currentTheme.text}`}>
                  Welcome back, {user.firstName}!
                </h2>
              </div>
              <p className={`text-lg ${currentTheme.textSecondary} ml-[60px]`}>
                Manage your boards and bring your projects to life
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className={`flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-xl hover:scale-105 hover:shadow-2xl transition-all shadow-lg group`}
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>New Project</span>
            </button>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-purple-200/20 dark:border-purple-800/20">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${currentTheme.bgSecondary} flex items-center justify-center`}>
                  <Folder className={`w-5 h-5 ${currentTheme.primaryText}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${currentTheme.text}`}>{boards.length}</p>
                  <p className={`text-xs ${currentTheme.textMuted}`}>Active Projects</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${currentTheme.bgSecondary} flex items-center justify-center`}>
                  <Users className={`w-5 h-5 ${currentTheme.primaryText}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${currentTheme.text}`}>
                    {boards.reduce((acc, board) => acc + board.members.length, 0)}
                  </p>
                  <p className={`text-xs ${currentTheme.textMuted}`}>Team Members</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${currentTheme.bgSecondary} flex items-center justify-center`}>
                  <CheckSquare className={`w-5 h-5 ${currentTheme.primaryText}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${currentTheme.text}`}>Active</p>
                  <p className={`text-xs ${currentTheme.textMuted}`}>System Status</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loadError && (
          <div className={`mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700`}>
            {loadError}
          </div>
        )}

        {isLoadingBoards ? (
          <div className="text-center py-20">
            <p className={`${currentTheme.textMuted}`}>Loading projects...</p>
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <Folder className={`w-16 h-16 ${currentTheme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${currentTheme.textSecondary} mb-2`}>No projects yet</h3>
            <p className={`${currentTheme.textMuted} mb-6`}>Create your first project to get started</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg`}
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => {
              const canManageBoard = isBoardOwner(board, user.id);

              return (
                <div
                  key={board.id}
                  className={`relative ${currentTheme.cardBg} rounded-2xl border-2 ${currentTheme.border} p-6 hover:${currentTheme.primaryBorder} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group`}
                >
                  {canManageBoard && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditBoard(board);
                        }}
                        className={`absolute top-4 right-4 p-2 ${currentTheme.bgSecondary} rounded-lg hover:${currentTheme.bgTertiary} opacity-0 group-hover:opacity-100 transition-all duration-200 z-10`}
                        title="Edit Project"
                      >
                        <Edit3 className={`w-4 h-4 ${currentTheme.textSecondary} hover:${currentTheme.primaryText}`} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBoardToDelete(board);
                          setIsDeleteDialogOpen(true);
                        }}
                        className={`absolute top-4 right-14 p-2 ${currentTheme.bgSecondary} rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 hover:bg-red-50 dark:hover:bg-red-950/30`}
                        title="Delete Project"
                      >
                        <Trash2 className={`w-4 h-4 ${currentTheme.textSecondary} hover:text-red-500 transition-colors`} />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleSelectBoard(board.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <Folder className="w-6 h-6" />
                      </div>
                      <ArrowRight className={`w-5 h-5 ${currentTheme.textMuted} group-hover:${currentTheme.primaryText} group-hover:translate-x-1 transition-all duration-300`} />
                    </div>

                    <h3 className={`text-xl font-bold ${currentTheme.text} mb-2 group-hover:${currentTheme.primaryText} transition-colors duration-300`}>
                      {board.name}
                    </h3>
                    <p className={`text-sm ${currentTheme.textSecondary} mb-4 line-clamp-2 min-h-[2.5rem]`}>
                      {board.description || "No description"}
                    </p>

                    <div className={`flex items-center gap-4 text-xs ${currentTheme.textMuted}`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(board.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckSquare className="w-4 h-4" />
                        <span>{board.members.length} member{board.members.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-4">
                      {board.members.slice(0, 4).map((member) => (
                        <div
                          key={member.userId}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ${isDarkMode ? 'ring-gray-800' : 'ring-white'} group-hover:ring-purple-200 dark:group-hover:ring-purple-800 transition-all duration-300`}
                          style={{ backgroundColor: member.color }}
                          title={member.name}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {board.members.length > 4 && (
                        <div className={`w-8 h-8 rounded-full ${currentTheme.bgTertiary} flex items-center justify-center ${currentTheme.textSecondary} text-xs font-bold ring-2 ${isDarkMode ? 'ring-gray-800' : 'ring-white'} group-hover:ring-purple-200 dark:group-hover:ring-purple-800 transition-all duration-300`}>
                          +{board.members.length - 4}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBoardCreated={handleBoardCreated}
      />

      <EditProjectModal
        key={selectedBoard ? `${selectedBoard.id}-${isEditModalOpen ? 'open' : 'closed'}` : 'no-board'}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        board={selectedBoard}
        onBoardUpdated={handleBoardUpdated}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <ConfirmDeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        board={boardToDelete}
        onBoardDeleted={handleDeleteBoard}
      />
    </div>
  );
}
