import {
  Entity,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn
} from "typeorm";
import { Website } from "src/domains/inventory/website/website.entity";
import { Tag } from "src/domains/inventory/tag/tag.entity";


@Entity("website_tags") 
@Index(["tagId"])
export class TagWebsite  {
  
  @Index()
  @PrimaryColumn({ name: "website_id", type: "int", unsigned: true, nullable: false })
  websiteId: number;

  @PrimaryColumn({ name: "tag_id", type: "int", unsigned: true, nullable: false })
  tagId: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @ManyToOne(() => Website, { onDelete: "CASCADE" })
  @JoinColumn({ name: "website_id" })
  website: Website;

  @ManyToOne(() => Tag, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tag_id" })
  tag: Tag;
}