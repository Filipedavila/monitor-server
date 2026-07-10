import { Evaluation } from "src/domains/audit-engine/evaluation/entities/evaluation.entity";
import { Context } from "src/domains/inventory/context/context.identity";
import { Entity, Index, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";


@Entity("evaluation_contexts")
@Index("idx_evaluation_contexts_lookup", ["contextId", "evaluationId"])
export class EvaluationContext {
  
  @PrimaryColumn({ name: "context_id", type: "int" })
  contextId: number;

  @PrimaryColumn({ name: "evaluation_id", type: "int" })
  evaluationId: number;

  @ManyToOne(() => Evaluation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "evaluation_id" })
  evaluation: Evaluation;

  @ManyToOne(() => Context, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "context_id" })
  context: Context;
  
}