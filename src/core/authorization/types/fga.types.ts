
export const FGA_RESOURCE = {
  USER: 'user',
  ROLE: 'role',
  TEAM: 'team',
  WEBSITE: 'website'
} as const;

export type SubjectType = typeof FGA_RESOURCE[keyof typeof FGA_RESOURCE];
export type ResourceType = typeof FGA_RESOURCE[keyof typeof FGA_RESOURCE];

export type EnquireableResource = keyof EnquireRelationType;
export type AssignableResource = keyof AssignationRelationType;

export type AssignationRelationType = {
  
  [FGA_RESOURCE.ROLE]: 'manager' | 'editor' | 'viewer';
  [FGA_RESOURCE.TEAM]: 'admin' | 'member' | 'team_role' | 'admin_role';
  [FGA_RESOURCE.WEBSITE]: 'parent' | 'admin_role' | 'viewer' | 'editor' | 'manager';
}

export type EnquireRelationType = {
  [FGA_RESOURCE.ROLE]: 'can_manage_users' | 'can_edit_users' | 'can_view_users';
  [FGA_RESOURCE.TEAM]: 'admin' | 'member' | 'team_role' | 'admin_role' | 'can_manage' | 'can_edit' | 'can_view';
  [FGA_RESOURCE.WEBSITE]: 'parent' | 'owner' | 'viewer' | 'editor' | 'manager' | 'can_manage' | 'can_edit' | 'can_view';
}

export interface AuthTuple {
  user: FgaUserIdentifier<ResourceType>;
  relation: EnquireRelationType[Extract<ResourceType, keyof EnquireRelationType>];
  object: FgaObjectIdentifier<ResourceType>;
}


export type FgaUserIdentifier<T extends ResourceType> = `${T}:${string}`;
export type FgaObjectIdentifier<T extends ResourceType> = `${T}:${string}`;


export interface FgaTupleEnquire<T extends EnquireableResource> {
  user: FgaObjectIdentifier<T>;
  relation: EnquireRelationType[Extract<T, keyof EnquireRelationType>]; 
  object: FgaObjectIdentifier<T>;
}

export interface FgaTupleAssign<T extends ResourceType, A extends AssignableResource> {
  user: FgaUserIdentifier<T>;
  relation: AssignationRelationType[Extract<A, keyof AssignationRelationType>]; 
  object: FgaObjectIdentifier<A>;
}


