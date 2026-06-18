import { Entity, Column, Index, ManyToOne, JoinColumn } from "typeorm";
import { BaseModel } from "../../../common/entities/base.entity";
import { Website } from "../../inventory/website/website.entity";

export enum EvaluationAspect {
  CONTENT = 'content',
  FUNCTIONAL = 'functional',
  TRANSACTION = 'transaction'
}

export interface TestResultEntry {
  group: number;
  test: number;
  results: string | undefined;
  evidences: string | undefined;
  notes: string | undefined;
}

export type RawEvaluationResult = Record<string, TestResultEntry[]>;

@Entity("manual_evaluations") 
@Index(["websiteId", "aspect"]) 
export class ManualEvaluation extends BaseModel {

  @ManyToOne(() => Website, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "websiteId" })
  website: Website;

  @Column({ name: "websiteId", type: "integer" })
  websiteId: number;

  @Column({
    type: "enum",
    enum: EvaluationAspect,
    nullable: false
  })
  aspect: EvaluationAspect;

  @Column({ type: "timestamptz", nullable: false })
  evaluationDate: Date;

@Column({ 
    name: "compliance_score", 
    type: "numeric", 
    precision: 5, 
    scale: 2, 
    nullable: false 
  })  complianceScore: number;

  @Column({ name: "raw_result", type: "jsonb", nullable: false })
  rawResult: RawEvaluationResult; 
}