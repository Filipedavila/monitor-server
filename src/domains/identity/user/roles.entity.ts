import { Entity, Column } from "typeorm";
import { BaseModel } from "../../../common/entities/base.entity";
import { RoleSlug } from "src/core/authentication/interfaces/types";
/*
const RoleSlug = {
  ADMIN: "admin",
  STUDY: "study",
  MONITOR: "monitor",
} as const;

export type RoleSlug = (typeof RoleSlug)[keyof typeof RoleSlug];
*/

@Entity("roles")
export class Role extends BaseModel {
  @Column({
    name: "slug",
    type: "varchar",
    length: 50,
    unique: true,
  })
  slug: RoleSlug;

  @Column({
    name: "display_name",
    type: "varchar",
    length: 100,
  })
  displayName: string;

  @Column({
    name: "description",
    type: "text",
    nullable: true,
  })
  description?: string;
}
