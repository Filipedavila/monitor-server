
import { Tag } from "src/domains/inventory/tag/tag.entity";
import { Website } from "src/domains/inventory/website/website.entity";
import { 
  Entity, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn, 
  PrimaryColumn,
  Index
} from "typeorm";


@Entity("tags_websites")
@Index(["websiteId"])
export class TagWebsite {

  @PrimaryColumn({ name: "tag_id", type: "int", unsigned: true, nullable: false })
  tagId: number;

  @PrimaryColumn({ name: "website_id", type: "int", unsigned: true, nullable: false })
  websiteId: number;

  @ManyToOne(() => Tag, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tag_id" })
  tag: Tag;

  @ManyToOne(() => Website, { onDelete: "CASCADE" })
  @JoinColumn({ name: "website_id" })
  website: Website;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ name: "created_by_id", type: "int", unsigned: true, nullable: true })
  createdById: number;
}