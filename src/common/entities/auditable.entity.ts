import { Column, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "./base.entity";
import { AuditUser } from "../types";


export abstract class AuditableEntity extends BaseModel {
  @Index()
  @Column({ name: "created_by_id", type: "int", unsigned: true, nullable: true }) 
  createdById: number;
  
  @ManyToOne("User", { nullable: true })
  @JoinColumn({ name: "created_by_id" })
  createdBy: AuditUser;

  @Index()
  @Column({ name: "updated_by_id", type: "int", unsigned: true, nullable: true })
  updatedById?: number;

  @ManyToOne("User", { nullable: true })
  @JoinColumn({ name: "updated_by_id" })
  updatedBy?: AuditUser;
}
