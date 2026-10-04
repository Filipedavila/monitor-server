import { Entity, Column, ManyToMany, JoinTable, JoinColumn, ManyToOne, Index, UpdateDateColumn, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";
import { Auditable } from "src/common/interfaces/auditable.interface";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
import { Context } from "../context/context.identity";
import { User } from "src/domains/identity/user/user.entity";


@Entity("tags")
export class Tag implements IdentifiableModel, Auditable {
  
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;
    
  @Column({ type: "varchar", length: 255, nullable: false })
  name: string;

  @ManyToMany(() => Context)
  @JoinTable({
    name: "tag_contexts",
    joinColumn: { name: "tag_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "context_id", referencedColumnName: "id" },
  })
  contexts: Context[];


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
