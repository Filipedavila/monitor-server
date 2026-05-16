import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({
  timestamps: true,
  collection: "evaluation_results",
})

export class EvaluationResult {
  @Prop({ type: Number, required: true, index: true })
  evaluationId: number;

  @Prop({ type: String, required: true })
  url: string;
  
  @Prop({ type: Object, required: true })
  tot: Record<string, any>;

  @Prop({ type: Object, required: true })
  errors: Record<string, any>;

  @Prop({ type: Object, required: true })
  elements:Record<string, any>;

  @Prop({ type: Object, required: true })
  tagCount:Record<string, any>;
  
}

export type EvaluationResultDocument = HydratedDocument<EvaluationResult>;

export const EvaluationResultSchema =
  SchemaFactory.createForClass(EvaluationResult);
