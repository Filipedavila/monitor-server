import { Website } from "../website/website.entity";
import {
  Entity,
  Column,
  BeforeUpdate,
  BeforeInsert,
  Index,
  ManyToOne,
  JoinColumn,
  JoinTable,
  ManyToMany,
} from "typeorm";
import { createHash } from "node:crypto";
import { AuditableEntity } from "../../../common/entities/auditable.entity";
import { Team } from "src/domains/identity/team/team.entity";

@Entity("pages")
@Index("idx_pages_visibility", ["websiteId", "showInPublic", "showInAms", "showInMonitor"])
export class Page extends AuditableEntity {
  @Column({ type: "text", nullable: false })
  url: string;

  @Index({ unique: true })
  @Column({
    name: "url_hash",
    type: "varchar",
    length: 64,
    nullable: false
  })
  url_hash: string;

  @Column({ name: "website_id", type: "int", unsigned: true, nullable: false })
  websiteId: number;

  @Column({ name: "show_in_ams", type: "boolean", default: false })
  showInAms: boolean;

  @Column({ name: "show_in_monitor", type: "boolean", default: false })
  showInMonitor: boolean;

  @Column({ name: "show_in_public", type: "boolean", default: false })
  showInPublic: boolean;

  @Column({ name: "average_score", type: "decimal", precision: 4, scale: 1, default: 0 })
  averageScore: number;

  @Column({ name: "total_evaluations", type: "int", unsigned: true, default: 0 })
  totalEvaluations: number;

  @ManyToOne(() => Website, { onDelete: "CASCADE" })
  @JoinColumn({ name: "website_id" })
  website: Website;
  @ManyToMany("Team", (team: Team) => team.pages)
  @JoinTable({
      name: "page_teams",
      joinColumn: { name: "page_id", referencedColumnName: "id" },
      inverseJoinColumn: { name: "team_id", referencedColumnName: "id" },
    })
    teams: Team[];
  @BeforeInsert()
  @BeforeUpdate()
  generateHash() {
    if (this.url) {
      this.url_hash = createHash("sha256").update(this.url).digest("hex");
    }
  }
}