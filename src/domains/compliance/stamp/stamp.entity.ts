import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  JoinColumn, 
  CreateDateColumn, 
  OneToOne,
  UpdateDateColumn,
  Index,
  ManyToOne
} from "typeorm";

import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
import {  BaseWebsite } from "src/common/types";
import { StampLevel } from "./enums/stamp-level.enum";
import { User } from "src/domains/identity/user/user.entity";

@Entity("website_stamps")
export class WebsiteStamp implements IdentifiableModel {
  
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @OneToOne("Website", { onDelete: "CASCADE" })
  @JoinColumn({ name: "website_id" })
  website: BaseWebsite;

  @Column({ name: "website_id", type: "int", unsigned: true })
  websiteId: number;

  @Column({ 
    name: "stamp", 
    type: "enum", 
    enum: StampLevel, 
    default: StampLevel.NONE 
  })
  stamp:StampLevel;

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