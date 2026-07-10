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
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
@Entity("crawler_pages")
export class CrawlerPage  implements IdentifiableModel {

  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;
  
  @ManyToOne("CrawlerWebsite", "pages", { onDelete: "CASCADE" })
  @JoinColumn({ name: "crawler_website_id" })
  crawlerWebsite: CrawlerWebsite;

  @Column({
    name: "crawler_website_id",
    type: "int",
    unsigned: true,
    nullable: false,
  })
  crawlerWebsiteId: number;

  @Column({
    type: "text",
    nullable: false,
  })
  url: string;

      


}
