export enum RoleSlug {
  ADMIN = "nimda",
  MONITOR = "monitor",
  STUDY = "study",
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  role_slug: string;
}
