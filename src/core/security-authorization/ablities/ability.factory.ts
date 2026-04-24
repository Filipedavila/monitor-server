import { Injectable, Type } from "@nestjs/common";
import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
} from "@casl/ability";
import { AuthenticatedUser } from "../../auth/interfaces/types";
import { BaseModel } from "src/common/entities/base.entity";
import { AbilityRegistry } from "./ability.registry";
import { Action, AppAbility, Subjects } from "../ability.types";




@Injectable()
export class AbilityFactory   {
  constructor(
    private readonly abilityRegistry: AbilityRegistry,
  )  {}



 defineAbility<T extends BaseModel>(user: AuthenticatedUser, entity: Type<T>): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
  const { can, cannot, build } = builder;
    const POLICY = this.abilityRegistry.getPolicyForEntity(entity.name);

    if (POLICY) {

      POLICY.define(user, builder);
    }else {
      cannot(Action.Manage, 'all');
    }


  return build({
    detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
  });
  }
}