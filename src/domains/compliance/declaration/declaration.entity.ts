import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
import { Auditable } from "src/common/interfaces/auditable.interface";
import { AuditStatus } from "src/common/enums/audit-status.enum";
import { Website } from "src/domains/inventory/website/website.entity";
import { User } from "src/domains/identity/user/user.entity";


@Entity("website_declarations")
export class WebsiteDeclaration implements IdentifiableModel, Auditable {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @OneToOne(() => Website, { onDelete: "CASCADE" })
  @JoinColumn({ name: "website_id" })
  website: Website;

  @Column({ name: "website_id", type: "int", unsigned: true })
  websiteId: number;

  @Column({ name: "status", type: "enum", enum: AuditStatus, default: AuditStatus.NAO_CONFORME })
  declaration: AuditStatus;

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