import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Request } from "express";
import { ContextHierarchyByRole, ContextEnum } from "src/domains/inventory/context/context.enum";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { User } from "src/domains/identity/user/user.entity";

@Injectable()
export class ContextFilterGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user: User = (request as any).user; 

    if (!user) {
      throw new ForbiddenException("Authentication context not found.");
    }

    const userRole: RoleSlug = user.role.slug as RoleSlug; 

    const targetContexts: ContextEnum[] = request.body?.filters?.contexts;

    if (!targetContexts || targetContexts.length === 0) {
      return true;
    }

    const allowedContexts = ContextHierarchyByRole[userRole];

    if (!allowedContexts) {
      throw new ForbiddenException("Your role has no authorized contexts.");
    }
    // filter valid target contexts
    const validTargetContexts = targetContexts.filter(target => 
      Object.values(ContextEnum).includes(target)
    );
    
    if (validTargetContexts.length === 0) {
      // nothing to permit or deny, so allow the request to proceed
      return true;
    }
    const isAuthorized = validTargetContexts.every(target => 
      allowedContexts.includes(target)
    );

    if (!isAuthorized) {
      throw new ForbiddenException(
        "You are not permitted to filter data by one or more of the requested contexts."
      );
    }

    return true;
  }
}