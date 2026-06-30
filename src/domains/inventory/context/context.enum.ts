import { RoleSlug } from "src/core/authentication/interfaces/types";

export enum ContextEnum {
  AMS = "AMS",
  MONITOR = "MONITOR",
  OBSERVATORY = "OBSERVATORY"
}

export const ContextMap: Record<ContextEnum, number> = {
  [ContextEnum.AMS]: 1,
  [ContextEnum.MONITOR]: 2,
  [ContextEnum.OBSERVATORY]: 3
};

export const ContextMapByRole: Record<RoleSlug, ContextEnum> = {
  [RoleSlug.ADMIN]: ContextEnum.AMS,
  [RoleSlug.MONITOR]: ContextEnum.MONITOR,
};

export const ContextHierarchyByRole: Record<RoleSlug, ContextEnum[]> = {
  [RoleSlug.ADMIN]: [ContextEnum.AMS, ContextEnum.MONITOR, ContextEnum.OBSERVATORY],
  [RoleSlug.MONITOR]: [ContextEnum.MONITOR, ContextEnum.OBSERVATORY],
};

function getContextIdByCode(code: ContextEnum): number | undefined {
  return ContextMap[code];
}

export { getContextIdByCode };