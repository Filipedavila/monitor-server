import { Entity, Column, ManyToMany, JoinTable } from "typeorm";
import { AuditableEntity } from "../../../common/entities/auditable.entity";
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
  @JoinTable({
    name: "team_websites",
    joinColumn: { name: "team_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "website_id", referencedColumnName: "id" },
  })
  websites: BaseWebsite[];

  @ManyToMany("Page", (page: any) => page.teams)
  @JoinTable({
    name: "team_pages",
    joinColumn: { name: "team_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "page_id", referencedColumnName: "id" },
  })
  pages: any[];

  @ManyToMany("User", (user: any) => user.teams)
  @JoinTable({
    name: "team_users",
    joinColumn: { name: "team_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "user_id", referencedColumnName: "id" },
  })
  users: BaseUser[];

}
