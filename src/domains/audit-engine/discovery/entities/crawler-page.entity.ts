import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeUpdate,
  BeforeInsert,
} from "typeorm";
import { CrawlerWebsite } from "./crawler-website.entity";
import { BaseModel } from "../../../../common/entities/base.entity";
import { createHash } from "crypto";
@Entity("crawl_pages")
export class CrawlerPage extends BaseModel {
  @ManyToOne("CrawlerWebsite", "pages", { onDelete: "CASCADE" })
  @JoinColumn({ name: "crawl_website_id" })
  crawlWebsite?: CrawlerWebsite;

  @Column({
    name: "crawl_website_id",
    type: "int",
    unsigned: true,
    nullable: false,
  })
  crawlWebsiteId: number;

  @Column({
    type: "text",
    nullable: false,
  })
  url: string;

  @Index({ unique: true })
  @Column({
    type: "varchar",
    length: 64,
    nullable: false
  })
  url_hash: string;

  @BeforeInsert()
  @BeforeUpdate()
  generateHash() {
    if (this.url) {
      this.url_hash = createHash("sha256").update(this.url).digest("hex");
    }
  }
}
