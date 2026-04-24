import { AbilityBuilder } from "@casl/ability";
import { Injectable } from "@nestjs/common";
import { AuthenticatedUser, RoleSlug } from "src/core/auth/interfaces/types";
import { EntityPolicy, RolePolicyRegistry,Action, AppAbility } from "../ability.types";
import { EvaluationResult } from "src/domains/audit-engine/evaluation/entities/evaluation-result.entity";

@Injectable()
export class EvaluationResultPolicy implements EntityPolicy {

  rolesRegistry: RolePolicyRegistry = {
    [RoleSlug.ADMIN]: (user, builder) => {
      builder.can(Action.Manage, EvaluationResult);
    },
    [RoleSlug.MONITOR]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], EvaluationResult, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], EvaluationResult, {
        ownerId: user.id
      });
    },
    [RoleSlug.STUDY]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], EvaluationResult, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], EvaluationResult, {
        ownerId: user.id
      });
    },

    [RoleSlug.GUEST]: (user, builder) => {
      builder.cannot(Action.Delete, EvaluationResult);
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
         cannot(Action.Manage, EvaluationResult);
   
     }
  }
}