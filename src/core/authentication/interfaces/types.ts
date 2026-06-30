
export enum RoleSlug {
  ADMIN = "nimda",
  MONITOR = "monitor"
}
export const RoleSlugMap: Record<string, RoleSlug> = {
  "nimda": RoleSlug.ADMIN,
  "monitor": RoleSlug.MONITOR
};

export interface AuthenticatedUser {
  id: number;
  username: string;
  role_slug: RoleSlug;
}


export interface SecurityContext {
  user: AuthenticatedUser;
}