import {
  Entity,
  Column,
  JoinTable,
  ManyToMany,
  BeforeUpdate,
  BeforeInsert,
  Index,
} from "typeorm";
import { Tag } from "../tag/tag.entity";
import type { Organization } from "../organization/organization.entity";
import { AuditableEntity } from "../../../common/entities/auditable.entity";
import { Team } from "src/domains/identity/team/team.entity";

@Entity("websites")
@Index("idx_websites_base_url", ["baseUrl"], { unique: true })
export class Website extends AuditableEntity {
  @Column({ name: "title", type: "varchar", length: 255, nullable: false })
  title: string;
 
  @Column({ name: "base_url", type: "varchar", unique: true, length: 255, nullable: false })
  baseUrl: string;
  
  @Column({ name: "declaration_status", type: "int", default: 0 })
  declarationStatus: number;

  @Column({ name: "declaration_updated_at", type: "timestamp", nullable: true })
  declarationUpdatedAt?: Date;

  @Column({ name: "stamp_status", type: "int", default: 0 })
  stampStatus: number;

  @Column({ name: "stamp_updated_at", type: "timestamp", nullable: true })
  stampUpdatedAt?: Date;

  @ManyToMany("Tag", "Website")
  @JoinTable({
    name: "website_tags",
    joinColumn: { name: "website_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags: Tag[];


  @ManyToMany("Organization", (org: Organization) => org.websites)
  @JoinTable({
    name: "website_organizations",
    joinColumn: { name: "website_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "organization_id", referencedColumnName: "id" },
  })
  organizations: Organization[];

  @ManyToMany("Team", (team: Team) => team.websites)
  @JoinTable({
    name: "website_teams",
    joinColumn: { name: "website_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "team_id", referencedColumnName: "id" },
  })
  teams: Team[];


  @Column( { name: "is_in_observatory", type: "boolean", default: false })
  isInObservatory: boolean;


  @BeforeInsert()
  @BeforeUpdate()
  normalizeBaseUrl() {
    if (this.baseUrl) {
      this.baseUrl = this.baseUrl
        .trim()
        .toLowerCase()
        .replace(/\/+$/, "");
    }
  }
}
