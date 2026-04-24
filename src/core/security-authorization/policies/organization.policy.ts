import { AbilityBuilder } from "@casl/ability";
import { Injectable } from "@nestjs/common";
import { AuthenticatedUser, RoleSlug } from "src/core/auth/interfaces/types";
import { Tag } from "src/domains/inventory/tag/tag.entity";
import { EntityPolicy, RolePolicyRegistry,Action, AppAbility } from "../ability.types";
import { Organization } from "src/domains/identity/organization/organization.entity";

@Injectable()
export class TagPolicy implements EntityPolicy {

  rolesRegistry: RolePolicyRegistry = {
    [RoleSlug.ADMIN]: (user, builder) => {
      builder.can(Action.Manage, Organization);
    },
    [RoleSlug.MONITOR]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], Organization, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], Organization, {
        ownerId: user.id
      });
    },
    [RoleSlug.STUDY]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], Organization, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], Organization, {
        ownerId: user.id
      });
    },

    [RoleSlug.GUEST]: (user, builder) => {
      builder.cannot(Action.Delete, Organization);
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
         cannot(Action.Manage, Organization);
   
     }
  }
}