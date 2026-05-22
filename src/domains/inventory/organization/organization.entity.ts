import { Entity, Column, ManyToMany } from "typeorm";
import { AuditableEntity } from "../../../common/entities/auditable.entity";
import {DeletionMetadata} from "../../../common/entities/soft-deletable.entity";
import { BaseUser, BaseWebsite } from "src/common/types";

@Entity("organizations")
export class Organization extends AuditableEntity {
  @Column({
    name: "short_name",
    type: "varchar",
    length: 100,
    nullable: false,
    unique: true,
  })
  shortName: string;

  @Column({
    name: "long_name",
    type: "varchar",
    length: 255,
    nullable: false,
    unique: true,
  })
  longName: string;

  @ManyToMany("Website", (website: any) => website.organizations)
  websites: BaseWebsite[];


}
