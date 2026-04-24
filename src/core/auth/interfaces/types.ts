export enum RoleSlug {
  ADMIN = "nimda",
  MONITOR = "monitor",
  STUDY = "user",
  GUEST = "guest",
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  role_slug: string;
  orgs: string[];
}
