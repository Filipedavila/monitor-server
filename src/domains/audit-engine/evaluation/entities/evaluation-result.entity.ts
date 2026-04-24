import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({
  timestamps: true,
  collection: "evaluation_results",
})
export class EvaluationResult {
  @Prop({ type: Number, required: true, index: true })
  evaluationId: number;

  @Prop({ type: Object, required: true })
  results: Record<string, any>;

  @Prop({ type: String, required: true })
  url: string;
}

export type EvaluationResultDocument = HydratedDocument<EvaluationResult>;

export const EvaluationResultSchema =
  SchemaFactory.createForClass(EvaluationResult);
