import { AbilityBuilder, InferSubjects, PureAbility } from "@casl/ability";
import { User } from "src/domains/identity/user/user.entity";
import { Page } from "src/domains/inventory/page/page.entity";
import { Website } from "src/domains/inventory/website/website.entity";
import { AuthenticatedUser, RoleSlug } from "../auth/interfaces/types";
import { Tag } from "src/domains/inventory/tag/tag.entity";
import { Directory } from "src/domains/inventory/directory/directory.entity";
import { Organization } from "src/domains/identity/organization/organization.entity";
import { Evaluation } from "src/integrations/observatory/models/evaluation";
import { EvaluationResult } from "src/domains/audit-engine/evaluation/entities/evaluation-result.entity";

export const Action = {
  Manage: "manage",
  Create: "create",
  Read: "read",
  Update: "update",
  Execute: "execute",
  Delete: "delete",
} as const;

export type Subjects = InferSubjects<typeof User | 
                                    typeof Website |
                                     typeof Page |
                                     typeof Tag |
                                     typeof Directory |
                                     typeof Organization |
                                     typeof Evaluation |
                                     typeof EvaluationResult > | "all";

export type Actions = (typeof Action)[keyof typeof Action];

export type AppAbility = PureAbility<[Actions, Subjects]>;



export type RolePolicyRegistry = {
  [K in RoleSlug]: (user: AuthenticatedUser, 
    builder: AbilityBuilder<AppAbility>  ) => void; 
};


export interface EntityPolicy {
  /**
   * @param user O utilizador autenticado
   * @param can Atalho para builder.can
   * @param cannot Atalho para builder.cannot
   * @param builder O objeto completo para casos complexos (ex: regras dinâmicas)
   */
  define(
    user: AuthenticatedUser, 
    builder: AbilityBuilder<AppAbility>
  ): void;
  rolesRegistry: RolePolicyRegistry;
}
