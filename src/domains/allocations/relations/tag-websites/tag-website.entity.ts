import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
import { Website } from "src/domains/inventory/website/website.entity";
import { Tag } from "src/domains/inventory/tag/tag.entity";


@Entity("website_tags") 
@Index("idx_website_tags_unique", ["websiteId", "tagId"], { unique: true })
export class TagWebsite implements IdentifiableModel {
  
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Index()
  @Column({ name: "website_id", type: "int", unsigned: true, nullable: false })
  websiteId: number;

  @Index()
  @Column({ name: "tag_id", type: "int", unsigned: true, nullable: false })
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