import { Entity, Column } from "typeorm";
import { BaseModel } from "../../../common/entities/base.entity";

@Entity("roles")
export class Role extends BaseModel {
  @Column({
    name: "slug",
    type: "varchar",
    length: 50,
    unique: true,
  })
  slug: string;

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
