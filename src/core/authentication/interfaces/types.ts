export enum RoleSlug {
  ADMIN = 'nimda',
  MONITOR = 'monitor',
}

export enum UserPermission {
  MANAGER = 'manager',
  VIEWER = 'viewer',
  EDITOR = 'editor',
}

export const RoleSlugMap: Record<string, RoleSlug> = {
  nimda: RoleSlug.ADMIN,
  monitor: RoleSlug.MONITOR,
};

class Context {
  public id: number;
  public code: string;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  role_slug: RoleSlug;
  context: Context;
}

export interface SecurityContext {
  user: AuthenticatedUser;
}
