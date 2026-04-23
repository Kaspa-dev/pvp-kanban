import { apiJson } from "./auth";

export interface ProjectUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
}

export async function searchUsers(query: string, limit = 3): Promise<ProjectUser[]> {
  return apiJson<ProjectUser[]>(
    `/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { method: "GET" },
    "Unable to load users right now.",
  );
}
