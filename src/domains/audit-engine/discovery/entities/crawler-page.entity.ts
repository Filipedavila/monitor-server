import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeUpdate,
  BeforeInsert,
} from "typeorm";
import { CrawlWebsite } from "./crawler-website.entity";
import { BaseModel } from "../../../../common/entities/base.entity";
import { createHash } from "crypto";
@Entity("crawl_pages")
export class CrawlPage extends BaseModel {
  @ManyToOne("CrawlWebsite", "pages", { onDelete: "CASCADE" })
  @JoinColumn({ name: "crawl_website_id" })
  crawlWebsite?: CrawlWebsite;

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
    nullable: false,
    charset: "ascii",
    collation: "ascii_general_ci",
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
