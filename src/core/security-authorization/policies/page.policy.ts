import { AbilityBuilder } from "@casl/ability";
import { Injectable } from "@nestjs/common";
import { Page } from "src/domains/inventory/page/page.entity";
import { AuthenticatedUser, RoleSlug } from "src/core/auth/interfaces/types";
import { AppAbility, EntityPolicy, RolePolicyRegistry,Action } from "../ability.types";

@Injectable()
export class PagePolicy implements EntityPolicy {

  rolesRegistry: RolePolicyRegistry = {
    [RoleSlug.ADMIN]: (user, builder) => {
      builder.can(Action.Manage, Page);
    },
    [RoleSlug.MONITOR]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], Page, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], Page, {
        ownerId: user.id
      });
    },
    [RoleSlug.STUDY]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], Page, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], Page, {
        ownerId: user.id
      });
    },

    [RoleSlug.GUEST]: (user, builder) => {
      builder.cannot(Action.Delete, Page);
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
      cannot(Action.Manage, Page);

  }
}
}