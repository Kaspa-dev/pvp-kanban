export interface Sprint {
  id: string;
  boardId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed';
  createdAt: string;
  completedAt?: string;
}

const SPRINTS_STORAGE_KEY = 'banban_sprints';

export function getAllSprints(): Sprint[] {
  try {
    const data = localStorage.getItem(SPRINTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading sprints:', error);
    return [];
  }
}

export function getBoardSprints(boardId: string): Sprint[] {
  const allSprints = getAllSprints();
  return allSprints.filter(sprint => sprint.boardId === boardId);
}

export function getActiveSprint(boardId: string): Sprint | null {
  const sprints = getBoardSprints(boardId);
  return sprints.find(sprint => sprint.status === 'active') || null;
}

export function getPlannedSprint(boardId: string): Sprint | null {
  const sprints = getBoardSprints(boardId);
  return sprints.find(sprint => sprint.status === 'planned') || null;
}

export function getCompletedSprints(boardId: string): Sprint[] {
  const sprints = getBoardSprints(boardId);
  return sprints.filter(sprint => sprint.status === 'completed').sort((a, b) => {
    return new Date(b.completedAt || b.endDate).getTime() - new Date(a.completedAt || a.endDate).getTime();
  });
}

export function createSprint(
  boardId: string,
  name: string,
  startDate: string,
  endDate: string
): Sprint {
  const allSprints = getAllSprints();
  
  const newSprint: Sprint = {
    id: `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    boardId,
    name,
    startDate,
    endDate,
    status: 'planned',
    createdAt: new Date().toISOString(),
  };

  allSprints.push(newSprint);
  localStorage.setItem(SPRINTS_STORAGE_KEY, JSON.stringify(allSprints));
  
  return newSprint;
}

export function updateSprint(sprintId: string, updates: Partial<Sprint>): boolean {
  try {
    const allSprints = getAllSprints();
    const index = allSprints.findIndex(s => s.id === sprintId);
    
    if (index === -1) return false;
    
    allSprints[index] = { ...allSprints[index], ...updates };
    localStorage.setItem(SPRINTS_STORAGE_KEY, JSON.stringify(allSprints));
    
    return true;
  } catch (error) {
    console.error('Error updating sprint:', error);
    return false;
  }
}

export function startSprint(sprintId: string): boolean {
  return updateSprint(sprintId, { status: 'active' });
}

export function completeSprint(sprintId: string): boolean {
  return updateSprint(sprintId, { 
    status: 'completed',
    completedAt: new Date().toISOString()
  });
}

export function deleteSprint(sprintId: string): boolean {
  try {
    const allSprints = getAllSprints();
    const filtered = allSprints.filter(s => s.id !== sprintId);
    localStorage.setItem(SPRINTS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting sprint:', error);
    return false;
  }
}

export function getSprintStats(sprintId: string, cards: any[]): {
  totalTasks: number;
  completedTasks: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  tasksByStatus: {
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
  };
} {
  const sprintTasks = cards.filter(card => card.sprintId === sprintId);
  const completedTasks = sprintTasks.filter(card => card.status === 'done');
  
  return {
    totalTasks: sprintTasks.length,
    completedTasks: completedTasks.length,
    totalStoryPoints: sprintTasks.reduce((sum, card) => sum + (card.storyPoints || 0), 0),
    completedStoryPoints: completedTasks.reduce((sum, card) => sum + (card.storyPoints || 0), 0),
    tasksByStatus: {
      todo: sprintTasks.filter(card => card.status === 'todo').length,
      inProgress: sprintTasks.filter(card => card.status === 'inProgress').length,
      inReview: sprintTasks.filter(card => card.status === 'inReview').length,
      done: sprintTasks.filter(card => card.status === 'done').length,
    },
  };
}
