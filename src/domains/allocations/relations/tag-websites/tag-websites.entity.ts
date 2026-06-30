
import { Tag } from "src/domains/inventory/tag/tag.entity";
import { Website } from "src/domains/inventory/website/website.entity";
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  Index, 
  ManyToOne, 
  JoinColumn 
} from "typeorm";


@Entity("tags_websites")
@Index(["tagId", "websiteId"], { unique: true }) 
export class TagWebsite {

  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ name: "tag_id", type: "int", unsigned: true, nullable: false })
  tagId: number;

  @Column({ name: "website_id", type: "int", unsigned: true, nullable: false })
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