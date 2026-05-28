import { Entity, Column, ManyToMany } from "typeorm";
import { AuditableEntity } from "../../../common/entities/auditable.entity";
import {DeletionMetadata} from "../../../common/entities/soft-deletable.entity";
import { BaseUser, BaseWebsite } from "src/common/types";

@Entity("teams")
export class Team extends AuditableEntity {
  @Column({
    name: "short_name",
    type: "varchar",
    length: 100,
    nullable: false,
    unique: true,
  })
  teamName: string;

  @ManyToMany("Website", (website: any) => website.teams)
  websites: BaseWebsite[];

  @ManyToMany("User", (user: any) => user.teams)
  users: BaseUser[];

  @Column(() => DeletionMetadata , { prefix: false })
  deletionMetadata: DeletionMetadata;

}
