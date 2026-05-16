
export const FGA_RESOURCE = {
  USER: 'user',
  ROLE: 'role',
  ORGANIZATION: 'organization',
  WEBSITE: 'website',
  PAGE: 'page',
  CRAWLER_WEBSITE: 'crawler_website',
  CRAWLER_PAGE: 'crawler_page',
  EVALUATION: 'evaluation',
  DIRECTORY: 'directory',
  TAG: 'tag',
  ACCESSIBILITY_STATEMENT: 'accessibility_statement',
} as const;


export const FGA_RELATION = {
  // Roles Globais
  ROLE: 'member',
  // Atribuições e Contexto
  SYSTEM_ADMIN: 'system_admin',
  LOCAL_ADMIN: 'local_admin',
  LOCAL_MEMBER: 'local_member',
  CREATOR: 'creator',
  STUDY_ASSIGNEE: 'study_assignee',
  GLOBAL_ROLES: 'global_roles',

  // Hierarquia (Parents)
  PARENT_ORG: 'parent_org',
  PARENT_WEBSITE: 'parent_website',
  PARENT_CRAWLER_WEBSITE: 'parent_crawler_website',

  // Ações (Permissions)
  CAN_MANAGE: 'can_manage',
  CAN_EDIT: 'can_edit',
  CAN_VIEW: 'can_view',
  CAN_MONITOR: 'can_monitor',
  CAN_STUDY: 'can_study',
} as const;

// Helper Types para inferência
export type ResourceType = typeof FGA_RESOURCE[keyof typeof FGA_RESOURCE];
export type RelationType = typeof FGA_RELATION[keyof typeof FGA_RELATION];


export type FgaModelMap = {
  [FGA_RESOURCE.ROLE]: 'member';
  [FGA_RESOURCE.ORGANIZATION]: 'system_admin' | 'local_admin' | 'local_member' | 'can_manage' | 'can_edit' | 'can_view';
  [FGA_RESOURCE.WEBSITE]: 'parent_org' | 'creator' | 'study_assignee' | 'can_manage' | 'can_edit' | 'can_view';
  [FGA_RESOURCE.PAGE]: 'parent_website' | 'can_manage' | 'can_edit' | 'can_view';
  [FGA_RESOURCE.CRAWLER_WEBSITE]: 'parent_website' | 'creator' | 'can_manage' | 'can_edit' | 'can_view';
  [FGA_RESOURCE.CRAWLER_PAGE]: 'parent_crawler_website' | 'can_manage' | 'can_edit' | 'can_view';
  [FGA_RESOURCE.EVALUATION]: 'creator' | 'parent_website' | 'can_manage' | 'can_view';
  [FGA_RESOURCE.DIRECTORY]: 'parent_org' | 'global_roles' | 'can_manage' | 'can_view';
  [FGA_RESOURCE.TAG]: 'global_roles' | 'creator' | 'can_view' | 'can_manage';
  [FGA_RESOURCE.ACCESSIBILITY_STATEMENT]: 'global_roles' | 'creator' | 'can_manage' | 'can_view';
};




export type FgaUserIdentifier<T extends ResourceType> = `${T}:${string}`;
export type FgaObjectIdentifier<T extends ResourceType> = `${T}:${string}`;


export interface FgaTuple<T extends ResourceType> {
  user: FgaUserIdentifier<T> | FgaObjectIdentifier<ResourceType>;
  relation: FgaModelMap[Extract<T, keyof FgaModelMap>]; 
  object: FgaObjectIdentifier<T>;
}


export interface FgaCheck<T extends ResourceType> {
  user: FgaUserIdentifier<T>;
  relation: Extract<
    FgaModelMap[Extract<T, keyof FgaModelMap>], 
    'can_manage' | 'can_edit' | 'can_view' | 'can_monitor' | 'can_study'
  >;
  object: FgaObjectIdentifier<T>;
}


export function makeFgaTuple<T extends ResourceType>(
  type: T,
  id: string,
  relation: FgaModelMap[Extract<T, keyof FgaModelMap>],
  user: FgaUserIdentifier<T> | FgaObjectIdentifier<ResourceType>
): FgaTuple<T> {
  return {
    user,
    relation,
    object: `${type}:${id}` as FgaObjectIdentifier<T>,
  } as FgaTuple<T>;
}