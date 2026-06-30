import { Auditable } from "src/common/interfaces/auditable.interface";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
import { User } from "src/domains/identity/user/user.entity";
import { Context } from "src/domains/inventory/context/context.identity";
import { Entity, Column, Index, JoinColumn, ManyToOne, UpdateDateColumn, CreateDateColumn, PrimaryGeneratedColumn, ManyToMany, JoinTable, PrimaryColumn } from "typeorm";


@Entity("evaluations")
@Index('idx_evaluations_created_at', ['createdAt'])
export class Evaluation implements IdentifiableModel,  Auditable  {

  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;
  
 
  @Column({
    name: "page_id",
    type: "int",
    nullable: false,
  })
  pageId: number;

  @Column({
    name: "page_title",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  pageTitle: string;

  @Column({
    name: "score",
    type: "decimal",
    precision: 4,
    scale: 1,
    nullable: true,
  })
  score: string;

  @Column({
    type: "int",
    nullable: true,
  })
  A: number;

  @Column({
    type: "int",
    nullable: true,
  })
  AA: number;

  @Column({
    type: "int",
    nullable: true,
  })
  AAA: number;


  @Column({
    name: "tag_count",
    type: "int",
    nullable: true,
  })
  tagCount: number;

  @ManyToMany(() => Context)
  @JoinTable({
    name: "evaluation_contexts",
    joinColumn: { name: "evaluation_id", referencedColumnName: "id" },
    inverseJoinColumn:{ name: "context_id", referencedColumnName: "id" },
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
