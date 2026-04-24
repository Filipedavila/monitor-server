import { AbilityBuilder } from "@casl/ability";
import { Injectable } from "@nestjs/common";
import { AuthenticatedUser, RoleSlug } from "src/core/auth/interfaces/types";
import { User } from "src/domains/identity/user/user.entity";
import { EntityPolicy, RolePolicyRegistry,AppAbility, Action } from "../ability.types";


@Injectable()
export class UserPolicy implements EntityPolicy {

  rolesRegistry: RolePolicyRegistry = {
    [RoleSlug.ADMIN]: (user, builder) => {
      builder.can(Action.Manage, User);
    },
    [RoleSlug.MONITOR]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], User, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], User, {
        ownerId: user.id
      });
    },
    [RoleSlug.STUDY]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], User, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], User, {
        ownerId: user.id
      });
    },

    [RoleSlug.GUEST]: (user, builder) => {
      builder.cannot(Action.Delete, User);
    }
  };


  define(
    user: AuthenticatedUser, 
    { can, cannot }: AbilityBuilder<AppAbility>
  ): void {
    
   
    if (user.role_slug === RoleSlug.ADMIN) {
      can(Action.Manage, User);
      return; 
    }

    can([Action.Read, Action.Execute], User, {
      organizationId: { $in: user.orgs }
    });

 
    can([Action.Update, Action.Delete], User, {
      ownerId: user.id
    });


    if (user.role_slug === RoleSlug.GUEST) {
      cannot(Action.Delete, User);
    }
  }
}