
export const FGA_RESOURCE = {
  USER: 'user',
  ROLE: 'role',
  TEAM: 'team',
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
  ADMIN: 'admin',
  MEMBER: 'member',
  OWNER: 'owner',
  STUDY_ASSIGNEE: 'study_assignee',
  // Hierarquia (Parents)
  PARENT: 'parent',
  // Ações (Permissions)
  CAN_MANAGE: 'can_manage',
  CAN_EDIT: 'can_edit',
  CAN_VIEW: 'can_view',

} as const;

export type SubjectType = typeof FGA_RESOURCE[keyof typeof FGA_RESOURCE];
export type ResourceType = typeof FGA_RESOURCE[keyof typeof FGA_RESOURCE];
export type RelationType = typeof FGA_RELATION[keyof typeof FGA_RELATION];



export type FgaModelMap = {
  [FGA_RESOURCE.ROLE]: 'member';
  [FGA_RESOURCE.TEAM]: 'admin' | 'member' | 'can_manage' | 'can_edit' | 'can_view';
  [FGA_RESOURCE.WEBSITE]: 'parent' | 'owner' | 'study_assignee' | 'can_manage' | 'can_edit' | 'can_view';
  [FGA_RESOURCE.PAGE]: 'parent' | 'can_manage' | 'can_edit' | 'can_view';
  [FGA_RESOURCE.CRAWLER_WEBSITE]: 'parent' | 'owner' | 'can_manage' | 'can_edit' | 'can_view';
  [FGA_RESOURCE.CRAWLER_PAGE]: 'parent' | 'can_manage' | 'can_edit' | 'can_view';
  [FGA_RESOURCE.EVALUATION]: 'parent' | 'owner' | 'can_manage' | 'can_view';
  [FGA_RESOURCE.DIRECTORY]: 'admin' | 'can_manage' | 'can_view';
  [FGA_RESOURCE.TAG]: 'admin' | 'can_view' | 'can_manage';
  [FGA_RESOURCE.ACCESSIBILITY_STATEMENT]: 'admin' | 'can_manage' | 'can_view';
};

export interface AuthTuple {
  user: FgaUserIdentifier<ResourceType>;
  relation: RelationType;
  object: FgaObjectIdentifier<ResourceType>;
}


export type FgaUserIdentifier<T extends ResourceType> = `${T}:${string}`;
export type FgaObjectIdentifier<T extends ResourceType> = `${T}:${string}`;


export interface FgaTuple<T extends ResourceType> {
  user: FgaObjectIdentifier<T>;
  relation: FgaModelMap[Extract<T, keyof FgaModelMap>]; 
  object: FgaObjectIdentifier<T>;
}


export function makeFgaTuple<T extends ResourceType>(
  type: T,
  id: string,
  relation: FgaModelMap[Extract<T, keyof FgaModelMap>],
  user: FgaUserIdentifier<T>
): FgaTuple<T> {
  return {
    user,
    relation,
    object: `${type}:${id}`,
  };
}