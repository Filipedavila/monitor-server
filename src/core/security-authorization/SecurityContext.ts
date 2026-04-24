import { GranteeType } from "src/common/entities/base-access.entity";
import { z } from "zod";
import { AccessLevelCode } from "./entitities/access-level.entity";
import { SecurityContextValidationError } from "./exceptions/security-authorization.exceptions";
import { AuthenticatedUser } from "../auth/interfaces/types";

export interface SecurityContext {
  readonly user: AuthenticatedUser;

}

export const SecurityContextSchema = z
  .object({
    userId: z.number().int().positive("User ID must be a positive integer"),
    roleId: z.number().int().positive("Role ID must be a positive integer"),
    institutionId: z.number().int().positive().optional(),
  })
  .strict();

export function validateSecurityContext(
  securityContext: SecurityContext,
): void {
  try {
    SecurityContextSchema.parse(securityContext);
  } catch {
    console.error(
      `[SECURITY ALERT] Invalid context attempted at repository: ${JSON.stringify(securityContext)}`,
    );
    throw new SecurityContextValidationError("Security integrity check failed");
  }
} /**
 * Defines the visibility scope for secure queries.
 */
export enum AccessScope {
  /** * Returns only entities with an explicit access grant (uses INNER JOIN).
   * Best for strictly private data where access must be specifically authorized.
   */
  PRIVATE = "PRIVATE",

  /** * Returns permitted entities plus entities without any associated access grants (uses LEFT JOIN).
   * Best for hybrid data where some items are public/unrestricted and others are private.
   */
  INCLUSIVE = "INCLUSIVE",
}

export interface BaseGrant {
  granteeId: number;
  granteeType: GranteeType;
  accessLevel: AccessLevelCode[];
}
export const DatabaseOperation = {
  CREATE: "CREATE",
  READ: "READ",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;

export type DatabaseOperation =
  (typeof DatabaseOperation)[keyof typeof DatabaseOperation];

export type AccessPolicyMap = Record<DatabaseOperation, AccessLevelCode>;
