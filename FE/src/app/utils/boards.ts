// Board/Project management utilities

export interface BoardMember {
  name: string;
  color: string;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  members: BoardMember[];
  theme?: string;
  sprint?: {
    name: string;
    startDate: string;
    endDate: string;
  };
}

const BOARDS_STORAGE_KEY = 'banban_boards';

// Get all boards for a user
export function getUserBoards(userId: string): Board[] {
  const boardsData = localStorage.getItem(`${BOARDS_STORAGE_KEY}_${userId}`);
  if (!boardsData) {
    return [];
  }
  try {
    return JSON.parse(boardsData);
  } catch {
    return [];
  }
}

// Save boards for a user
export function saveUserBoards(userId: string, boards: Board[]): void {
  localStorage.setItem(`${BOARDS_STORAGE_KEY}_${userId}`, JSON.stringify(boards));
}

// Create a new board
export function createBoard(
  userId: string,
  name: string,
  description: string,
  members: BoardMember[]
): Board {
  const newBoard: Board = {
    id: `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    createdAt: new Date().toISOString(),
    createdBy: userId,
    members,
  };

  const boards = getUserBoards(userId);
  boards.push(newBoard);
  saveUserBoards(userId, boards);

  return newBoard;
}

// Get a specific board
export function getBoard(userId: string, boardId: string): Board | null {
  const boards = getUserBoards(userId);
  return boards.find(b => b.id === boardId) || null;
}

// Update a board
export function updateBoard(userId: string, boardId: string, updates: Partial<Board>): boolean {
  const boards = getUserBoards(userId);
  const index = boards.findIndex(b => b.id === boardId);
  
  if (index === -1) {
    return false;
  }

  boards[index] = { ...boards[index], ...updates };
  saveUserBoards(userId, boards);
  return true;
}

// Delete a board
export function deleteBoard(userId: string, boardId: string): boolean {
  const boards = getUserBoards(userId);
  const filtered = boards.filter(b => b.id !== boardId);
  
  if (filtered.length === boards.length) {
    return false; // Board not found
  }

  saveUserBoards(userId, filtered);
  
  // Also delete board's cards
  localStorage.removeItem(`banban_cards_${boardId}`);
  
  return true;
}

// Create default demo boards for new users
export function createDefaultBoards(userId: string, userName: string): Board[] {
  const defaultMembers: BoardMember[] = [
    { name: userName, color: "#3b82f6" },
    { name: "Jonas", color: "#10b981" },
    { name: "Marius", color: "#8b5cf6" },
    { name: "Laura", color: "#f59e0b" },
  ];

  const board1 = createBoard(
    userId,
    "My First Project",
    "Welcome to BanBan! This is your first project board.",
    defaultMembers
  );

  return [board1];
}