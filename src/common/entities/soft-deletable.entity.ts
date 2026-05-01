
import { Column, DeleteDateColumn, JoinColumn, ManyToOne } from "typeorm";
import { AuditUser } from "../types";

export class DeletionMetadata {
  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt?: Date;
  
  @Column({ name: "deleted_by", type: "int", unsigned: true, nullable: true })
  deletedById?: number;

  @ManyToOne("User", { nullable: true })
  @JoinColumn({ name: "deleted_by" })
  deletedBy?: AuditUser;

}