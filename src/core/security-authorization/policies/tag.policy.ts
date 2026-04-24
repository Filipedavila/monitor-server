import { AbilityBuilder } from "@casl/ability";
import { Injectable } from "@nestjs/common";
import { AuthenticatedUser, RoleSlug } from "src/core/auth/interfaces/types";
import { Tag } from "src/domains/inventory/tag/tag.entity";
import { EntityPolicy, RolePolicyRegistry,AppAbility , Action} from "../ability.types";


@Injectable()
export class TagPolicy implements EntityPolicy {

  rolesRegistry: RolePolicyRegistry = {
    [RoleSlug.ADMIN]: (user, builder) => {
      builder.can(Action.Manage, Tag);
    },
    [RoleSlug.MONITOR]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], Tag, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], Tag, {
        ownerId: user.id
      });
    },
    [RoleSlug.STUDY]: (user, builder) => {
      builder.can([Action.Read, Action.Execute], Tag, {
        organizationId: { $in: user.orgs }
      });
      builder.can([Action.Update, Action.Delete], Tag, {
        ownerId: user.id
      });
    },

    [RoleSlug.GUEST]: (user, builder) => {
      builder.cannot(Action.Delete, Tag);
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
         cannot(Action.Manage, Tag);
   
     }
  }
}