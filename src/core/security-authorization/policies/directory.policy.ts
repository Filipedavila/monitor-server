import { AbilityBuilder } from "@casl/ability";
import { Injectable } from "@nestjs/common";

import { AuthenticatedUser, RoleSlug } from "src/core/auth/interfaces/types";
import { Action, AppAbility, EntityPolicy, RolePolicyRegistry } from "../ability.types";
import { Directory } from "src/domains/inventory/directory/directory.entity";
import { EvaluationResult } from "src/domains/audit-engine/evaluation/entities/evaluation-result.entity";

@Injectable()
export class DirectoryPolicy implements EntityPolicy {

  rolesRegistry: RolePolicyRegistry = {
    [RoleSlug.ADMIN]: (user, builder) => {
      builder.can(Action.Manage, Directory);
    },
    [RoleSlug.MONITOR]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], Directory, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], Directory, {
        ownerId: user.id
      });
    },
    [RoleSlug.STUDY]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], Directory, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], Directory, {
        ownerId: user.id
      });
    },

    [RoleSlug.GUEST]: (user, builder) => {
      builder.cannot(Action.Delete, Directory);
    }
  };


  define(
    user: AuthenticatedUser, 
    { can, cannot }: AbilityBuilder<AppAbility>
  ): void {
    
   const abilities = this.rolesRegistry[user.role_slug];
         if (abilities) {
           abilities(user, { can, cannot });
         }else {
            cannot(Action.Manage, Directory);
      
    }
  }
}