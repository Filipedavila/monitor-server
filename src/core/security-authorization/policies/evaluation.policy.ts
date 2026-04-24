import { AbilityBuilder } from "@casl/ability";
import { Injectable } from "@nestjs/common";
import { Website } from "src/domains/inventory/website/website.entity";
import { AuthenticatedUser, RoleSlug } from "src/core/auth/interfaces/types";
import { EntityPolicy, RolePolicyRegistry,Action, AppAbility } from "../ability.types";

@Injectable()
export class EvaluationPolicy implements EntityPolicy {

  rolesRegistry: RolePolicyRegistry = {
    [RoleSlug.ADMIN]: (user, builder) => {
      builder.can(Action.Manage, Website);
    },
    [RoleSlug.MONITOR]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], Website, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], Website, {
        ownerId: user.id
      });
    },
    [RoleSlug.STUDY]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], Website, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], Website, {
        ownerId: user.id
      });
    },

    [RoleSlug.GUEST]: (user, builder) => {
      builder.cannot(Action.Delete, Website);
    }
  };


  define(
    user: AuthenticatedUser, 
    { can, cannot }: AbilityBuilder<AppAbility>
  ): void {
    
   
    if (user.role_slug === RoleSlug.ADMIN) {
      can(Action.Manage, Website);
      return; 
    }

    can([Action.Read, Action.Execute], Website, {
      organizationId: { $in: user.orgs }
    });

 
    can([Action.Update, Action.Delete], Website, {
      ownerId: user.id
    });


    if (user.role_slug === RoleSlug.GUEST) {
      cannot(Action.Delete, Website);
    }
  }
}