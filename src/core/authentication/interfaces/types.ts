export enum RoleSlug {
  ADMIN = "nimda",
  MONITOR = "monitor",
  STUDY = "user",
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  role_slug: string;
}
