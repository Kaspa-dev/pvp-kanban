// Labels management utilities - per board

export interface Label {
  id: string;
  name: string;
  color: string;
}

function getLabelsStorageKey(boardId: string): string {
  return `banban_labels_${boardId}`;
}

// Get labels for a specific board
export function getBoardLabels(boardId: string): Label[] {
  const labelsData = localStorage.getItem(getLabelsStorageKey(boardId));
  if (!labelsData) {
    return [];
  }
  try {
    return JSON.parse(labelsData);
  } catch {
    return [];
  }
}

// Save labels for a specific board
export function saveBoardLabels(boardId: string, labels: Label[]): void {
  localStorage.setItem(getLabelsStorageKey(boardId), JSON.stringify(labels));
}

export function migrateBoardLabelsStorage(fromBoardId: string, toBoardId: string): void {
  if (fromBoardId === toBoardId) {
    return;
  }

  const targetKey = getLabelsStorageKey(toBoardId);
  if (localStorage.getItem(targetKey)) {
    return;
  }

  const sourceKey = getLabelsStorageKey(fromBoardId);
  const sourceData = localStorage.getItem(sourceKey);
  if (!sourceData) {
    return;
  }

  localStorage.setItem(targetKey, sourceData);
  localStorage.removeItem(sourceKey);
}

// Create a new label
export function createLabel(boardId: string, name: string, color: string): Label {
  const labels = getBoardLabels(boardId);
  
  const newLabel: Label = {
    id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim(),
    color,
  };

  labels.push(newLabel);
  saveBoardLabels(boardId, labels);

  return newLabel;
}

// Update a label
export function updateLabel(boardId: string, labelId: string, updates: Partial<Label>): boolean {
  const labels = getBoardLabels(boardId);
  const index = labels.findIndex(l => l.id === labelId);
  
  if (index === -1) {
    return false;
  }

  labels[index] = { ...labels[index], ...updates };
  saveBoardLabels(boardId, labels);
  return true;
}

// Delete a label
export function deleteLabel(boardId: string, labelId: string): boolean {
  const labels = getBoardLabels(boardId);
  const filtered = labels.filter(l => l.id !== labelId);
  
  if (filtered.length === labels.length) {
    return false; // Label not found
  }

  saveBoardLabels(boardId, filtered);
  return true;
}

// Create default labels for a new board
export function createDefaultLabels(boardId: string): Label[] {
  const defaultLabels = [
    { name: "UI", color: "#8b5cf6" }, // purple
    { name: "Design", color: "#ec4899" }, // pink
    { name: "BE", color: "#10b981" }, // green
    { name: "FE", color: "#06b6d4" }, // cyan
    { name: "DevOps", color: "#f59e0b" }, // amber
    { name: "Docs", color: "#3b82f6" }, // blue
    { name: "Security", color: "#f97316" }, // orange
    { name: "DB", color: "#6366f1" }, // indigo
  ];

  const labels = defaultLabels.map(({ name, color }) => ({
    id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    color,
  }));

  saveBoardLabels(boardId, labels);
  return labels;
}

// Predefined colors for label creation
export const LABEL_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#10b981", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#64748b", // slate
  "#78716c", // stone
];
