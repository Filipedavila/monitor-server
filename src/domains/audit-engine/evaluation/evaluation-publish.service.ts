import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { EvaluationProducer } from "./redis/evaluation.producer"; 
import { IMetricData } from "./types";

@Injectable()
export class EvaluationPublishingService {
  constructor(private readonly evaluationProducer: EvaluationProducer) {}

  async execute(
    metrics: IMetricData[]
  ): Promise<void> {
    await this.publishMetrics(metrics);
  }

 

  private async publishMetrics(metrics: IMetricData[]): Promise<void> {
    const idPublish = await this.evaluationProducer.publishEvaluations(metrics);
    if (!idPublish) {
      throw new InternalServerErrorException(
        `Failed to publish evaluation results to Redis.`
      );
    }
  }
}