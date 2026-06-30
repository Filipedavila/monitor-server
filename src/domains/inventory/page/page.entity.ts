import { Website } from "../website/website.entity";
import {
  Entity,
  Column,
  BeforeUpdate,
  BeforeInsert,
  Index,
  ManyToOne,
  JoinColumn,
  JoinTable,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { createHash } from "node:crypto";
import { Auditable } from "src/common/interfaces/auditable.interface";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
import { Context } from "../context/context.identity";
import { User } from "src/domains/identity/user/user.entity";


@Entity("pages")
export class Page  implements IdentifiableModel, Auditable {

  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;
    
  @Column({ type: "text", nullable: false })
  url: string;

  @Index({ unique: true })
  @Column({
    name: "url_hash",
    type: "varchar",
    length: 64,
    nullable: false
  })
  url_hash: string;
  
  @ManyToOne(() => Website, { onDelete: "CASCADE" })
  @JoinColumn({ name: "website_id" })
  website: Website;
  
  @Column({ name: "website_id", type: "int", unsigned: true, nullable: false })
  websiteId: number;

  @ManyToMany(() => Context)  
  @JoinTable({
      name: "page_contexts",
      joinColumn: { name: "page_id", referencedColumnName: "id" },
      inverseJoinColumn: { name: "context_id", referencedColumnName: "id" },
    })
  contexts: Context[];


  @BeforeInsert()
  @BeforeUpdate()
  generateHash() {
    if (this.url) {
      this.url_hash = createHash("sha256").update(this.url).digest("hex");
    }
  }

  
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