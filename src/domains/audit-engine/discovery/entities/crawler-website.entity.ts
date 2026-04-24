import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { AuditableEntity } from "../../../../common/entities/auditable.entity";
import type { Website } from "../../../inventory/website/website.entity";

@Entity("crawl_websites")
export class CrawlWebsite extends AuditableEntity {
  @Column({ name: "base_url", type: "varchar", length: 255, nullable: false })
  baseUrl: string;

  @Column({ name: "website_id", type: "int", unsigned: true })
  websiteId: number;

  @ManyToOne("Website", (website: Website) => website.crawls, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "website_id" })
  website: Website;

  @Column({ name: "max_depth", type: "int", default: 0 })
  maxDepth: number;

  @Column({ name: "is_done", type: "boolean", default: false })
  isDone: boolean;

  @Column({ name: "tag_id", type: "int", default: null, nullable: true })
  tagId: number;

  pageCount?: number;
}
