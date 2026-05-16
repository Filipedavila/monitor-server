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
import type { Organization } from "../../identity/organization/organization.entity";
import { AuditableEntity } from "../../../common/entities/auditable.entity";

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
