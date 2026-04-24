import { Injectable } from "@nestjs/common";
import { WebsitePolicy } from "../policies/website.policy";
import { PagePolicy } from "../policies/page.policy";
import {  EntityPolicy } from "../ability.types";


const REGISTRY_WEBSITES :Record<string, EntityPolicy> = {
    Website: new WebsitePolicy(),
    Page: new PagePolicy(),
};

@Injectable()
export class AbilityRegistry {
  private  readonly registry: Record<string, EntityPolicy>;

  constructor() {
    this.registry = REGISTRY_WEBSITES;
  }

  getPolicyForEntity(entityName: string): EntityPolicy | null {
    return this.registry[entityName] || null;
  }
}