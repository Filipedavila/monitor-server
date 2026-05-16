import { Entity, Column, Index, ManyToOne, JoinColumn } from "typeorm";
import { BaseModel } from "../../../common/entities/base.entity";
import { Website } from "../../inventory/website/website.entity";

export enum EvaluationAspect {
  CONTENT = 'content',
  FUNCTIONAL = 'functional',
  TRANSACTION = 'transaction'
}

@Entity("manual_evaluations") 
@Index(["websiteId", "aspect"]) 
export class ManualEvaluation extends BaseModel {

  @ManyToOne(() => Website, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "websiteId" })
  website: Website;

  @Column({ name: "websiteId", type: "int", unsigned: true })
  websiteId: number;

  @Column({
    type: "enum",
    enum: EvaluationAspect,
    nullable: false
  })
  aspect: EvaluationAspect;

  @Column({ type: "datetime", nullable: false })
  evaluationDate: Date;

  @Column({ type: "double", precision: 5, scale: 2, nullable: false })
  complianceScore: number;

  @Column({ type: "longtext", nullable: false })
  rawResult: string; 
}