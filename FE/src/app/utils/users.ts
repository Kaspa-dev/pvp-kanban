import { apiJson } from "./auth";

export interface ProjectUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

export async function getUsers(): Promise<ProjectUser[]> {
  return apiJson<ProjectUser[]>(
    "/api/users",
    { method: "GET" },
    "Unable to load users right now.",
  );
}
