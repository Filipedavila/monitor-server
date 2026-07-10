import { Entity, Column,  ManyToOne, JoinColumn, Index, UpdateDateColumn, CreateDateColumn, PrimaryGeneratedColumn, JoinTable, ManyToMany } from "typeorm";
import { Website } from "../../../inventory/website/website.entity";
import { Auditable } from "src/common/interfaces/auditable.interface";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
import { User } from "src/domains/identity/user/user.entity";

export enum CrawlerStatus  {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}
@Entity("crawler_websites")
export class CrawlerWebsite  implements IdentifiableModel, Auditable {

  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ name: "base_url", type: "varchar", length: 255, nullable: false })
  baseUrl: string;

  @Column({ name: "website_id", type: "int"})
  websiteId: number;

  @ManyToOne(() => Website, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "website_id" })
  website: Website;
 
  @Column({ name: "max_depth", type: "int", default: 0 })
  maxDepth: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: CrawlerStatus,
    default: CrawlerStatus.PENDING
  })
  status: CrawlerStatus;


  pageCount?: number;
 
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
   
   @Index()
   @Column({ name: "created_by_id", type: "int", unsigned: true, nullable: true }) 
   createdById: number;
   
   @ManyToOne(() => User, { nullable: true })
   @JoinColumn({ name: "created_by_id" })
   createdBy: User;
   

   @Index()
   @Column({ name: "updated_by_id", type: "int", unsigned: true, nullable: true })
   updatedById: number | null;
 
   @ManyToOne(() => User, { nullable: true })
   @JoinColumn({ name: "updated_by_id" })
   updatedBy: User |  null;

}
