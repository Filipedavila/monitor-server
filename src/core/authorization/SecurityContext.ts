import { z } from "zod";
import { SecurityContextValidationError } from "./exceptions/security-authorization.exceptions";
import { AuthenticatedUser } from "../authentication/interfaces/types";

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
}