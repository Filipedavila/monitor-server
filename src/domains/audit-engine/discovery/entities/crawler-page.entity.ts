import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeUpdate,
  BeforeInsert,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CrawlerWebsite } from "./crawler-website.entity";
import { createHash } from "crypto";
import { Timestampable } from "src/common/interfaces/timestampable.interface";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
@Entity("crawl_pages")
export class CrawlerPage  implements IdentifiableModel, Timestampable {

  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;
  
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


  @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
      })
  createdAt: Date;
    
  @UpdateDateColumn({
        name: "updated_at",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
        onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
      
  @BeforeInsert()
  @BeforeUpdate()
  generateHash() {
    if (this.url) {
      this.url_hash = createHash("sha256").update(this.url).digest("hex");
    }
  }



}
