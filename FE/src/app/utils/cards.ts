// Card storage utilities - per board

export type Priority = "low" | "medium" | "high" | "critical";
export type TaskType = "story" | "task" | "bug" | "spike";

export interface Card {
  id: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  labelIds: string[]; // Changed from tags to labelIds
  assignee: {
    name: string;
    color: string;
  };
  status: "todo" | "inProgress" | "inReview" | "done" | "backlog";
  storyPoints?: number;
  sprintId?: string | null; // Sprint assignment - null means in backlog
  priority?: Priority; // New: task priority
  taskType?: TaskType; // New: task type
}

export interface Cards {
  todo: Card[];
  inProgress: Card[];
  inReview: Card[];
  done: Card[];
  backlog: Card[];
}

// Migrate old cards with 'tags' to new 'labelIds' format
function migrateCard(card: any): Card {
  // If card has old 'tags' field, migrate it to empty labelIds
  if (card.tags && !card.labelIds) {
    return {
      ...card,
      labelIds: [], // Old tags were just strings, not IDs, so start fresh
    };
  }
  // If card doesn't have labelIds at all, add empty array
  if (!card.labelIds) {
    return {
      ...card,
      labelIds: [],
    };
  }
  return card;
}

// Get cards for a specific board
export function getBoardCards(boardId: string): Cards {
  const cardsData = localStorage.getItem(`banban_cards_${boardId}`);
  if (!cardsData) {
    return {
      todo: [],
      inProgress: [],
      inReview: [],
      done: [],
      backlog: [],
    };
  }
  try {
    const parsed = JSON.parse(cardsData);
    // Migrate cards if needed
    return {
      todo: parsed.todo?.map(migrateCard) || [],
      inProgress: parsed.inProgress?.map(migrateCard) || [],
      inReview: parsed.inReview?.map(migrateCard) || [],
      done: parsed.done?.map(migrateCard) || [],
      backlog: parsed.backlog?.map(migrateCard) || [],
    };
  } catch {
    return {
      todo: [],
      inProgress: [],
      inReview: [],
      done: [],
      backlog: [],
    };
  }
}

// Save cards for a specific board
export function saveBoardCards(boardId: string, cards: Cards): void {
  localStorage.setItem(`banban_cards_${boardId}`, JSON.stringify(cards));
}

// Create default demo cards for a new board
// Note: labelIds should be actual label IDs from the board's labels
export function createDefaultCards(assigneeName: string, labelIds: { [key: string]: string } = {}): Cards {
  return {
    todo: [
      {
        id: "1",
        title: "Design new landing page",
        labelIds: [labelIds["UI"] || "", labelIds["Design"] || ""].filter(Boolean),
        assignee: { name: assigneeName, color: "#3b82f6" },
        status: "todo",
        storyPoints: 5,
        priority: "high",
        taskType: "story",
      },
      {
        id: "2",
        title: "Update user documentation",
        labelIds: [labelIds["Docs"] || ""].filter(Boolean),
        assignee: { name: "Jonas", color: "#10b981" },
        status: "todo",
        storyPoints: 3,
        priority: "medium",
        taskType: "task",
      },
    ],
    inProgress: [
      {
        id: "3",
        title: "Implement authentication",
        labelIds: [labelIds["BE"] || "", labelIds["Security"] || ""].filter(Boolean),
        assignee: { name: "Marius", color: "#8b5cf6" },
        status: "inProgress",
        storyPoints: 8,
        priority: "critical",
        taskType: "story",
      },
    ],
    inReview: [],
    done: [
      {
        id: "5",
        title: "Setup project repository",
        labelIds: [labelIds["DevOps"] || ""].filter(Boolean),
        assignee: { name: "Laura", color: "#06b6d4" },
        status: "done",
        storyPoints: 2,
        priority: "medium",
        taskType: "task",
      },
    ],
    backlog: [
      {
        id: "7",
        title: "Mobile app design mockups",
        labelIds: [labelIds["Design"] || "", labelIds["UI"] || ""].filter(Boolean),
        assignee: { name: assigneeName, color: "#3b82f6" },
        status: "backlog",
        storyPoints: 8,
        priority: "low",
        taskType: "spike",
      },
    ],
  };
}