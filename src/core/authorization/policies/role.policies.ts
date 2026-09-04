export const AMS_ROLE_MANAGER = {
  objectType: 'role',
  action: 'can_manage_users',
  resourceIdResolver: () => 'ams',
} as const;
export const AMS_ROLE_EDITOR = {
  objectType: 'role',
  action: 'can_edit_users',
  resourceIdResolver: () => 'ams',
} as const;
export const AMS_ROLE_VIEWER = {
  objectType: 'role',
  action: 'can_view_users',
  resourceIdResolver: () => 'ams',
} as const;

export const MONITOR_ROLE_MANAGER = {
  objectType: 'role',
  action: 'can_manage_users',
  resourceIdResolver: () => 'monitor',
} as const;
export const MONITOR_ROLE_EDITOR = {
  objectType: 'role',
  action: 'can_edit_users',
  resourceIdResolver: () => 'monitor',
} as const;
export const MONITOR_ROLE_VIEWER = {
  objectType: 'role',
  action: 'can_view_users',
  resourceIdResolver: () => 'monitor',
} as const;
