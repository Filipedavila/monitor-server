import { AuditableEntity } from "@common/entities/auditable.entity";
import { Entity, Column } from "typeorm";

export enum EvaluationContext {
  ADMIN_AMS = 'AMS',        
  MY_MONITOR = 'MONITOR',   
  STUDY_MONITOR = 'STUDY'    
}

@Entity("evaluations")
export class Evaluation extends AuditableEntity {
  @Column({
    type: "int",
    nullable: false,
  })
  pageId: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  pageTitle: string;

  @Column({
    type: "decimal",
    precision: 4,
    scale: 1,
    nullable: false,
  })
  score: string;

  @Column({
    type: "int",
    nullable: false,
  })
  A: number;

  @Column({
    type: "int",
    nullable: false,
  })
  AA: number;

  @Column({
    type: "int",
    nullable: false,
  })
  AAA: number;

  @Column({ type: 'enum', enum: EvaluationContext })
  context: EvaluationContext;


  @Column({
    type: "text",
    nullable: false,
  })
  elementCount: string;

  @Column({
    type: "text",
    nullable: false,
  })
  tagCount: string;
}
