import { Entity, Column, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, PrimaryGeneratedColumn } from "typeorm";
import { Website } from "../../../inventory/website/website.entity";

import { State } from "../state";
import { Auditable } from "src/common/interfaces/auditable.interface";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
import { User } from "src/domains/identity/user/user.entity";

@Entity("accessibility_statements")
export class AccessibilityStatement implements IdentifiableModel, Auditable  {

  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;
  @ManyToOne(() => Website,  {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "website_id" })
  website: Website;

  @Column({ name: "website_id" , type: "int", unsigned: true, nullable: false })
  websiteId:number;

  @Column({ type: "varchar", length: 255, nullable: false })
  conformance: string;

  @Column({ type: "text", nullable: false })
  evidence: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  seal: string;

  @Column({ name: "statement_date", type: "timestamptz", nullable: true })
  statementDate: Date;

  @Column({ type: "enum", enum: State })
  state: State;

  @Column({ type: "varchar", length: 255 })
  hash: string;

  @Column({ name: "last_consulted_at", type: "timestamptz", nullable: true })
  lastConsultedAt: Date;

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
