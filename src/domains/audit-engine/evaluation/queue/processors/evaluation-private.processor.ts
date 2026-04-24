import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { executeUrlEvaluation } from "../../util/middleware";
import { EvaluationService } from "../../services/evaluation.service";
import { Evaluation } from "../../entities/evaluation.entity";

@Processor("evaluation-queue-private")
export class EvaluationPrivateWorker extends WorkerHost {
  constructor(
    private readonly evaluationService: EvaluationService,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case "evaluation-job":
        console.log(
          "Processing evaluation job for websiteId:",
          job.data.websiteId,
        );
        return await this.evaluatePageAndSave(
          job.data.websiteId,
          job.data.url,
          job.data.showTo,
        );

      default:
        throw new Error(`No handler for job ${job.name}`);
    }
  }

  @OnWorkerEvent("active")
  onActive(job: Job) {
    console.log(`🏃 Job ${job.id} começou a ser processado.`);
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    console.log(`✅ Job ${job.id} terminou com sucesso!`);
    // Aqui podes disparar o teu EventEmitter2 para o resto da app
    this.eventEmitter.emit("crawl.success", job.data);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, error: Error) {
    console.error(`❌ Job ${job.id} falhou: ${error.message}`);
    // Log para monitorização (Sentry, Prometheus, etc.)
  }

  async evaluatePageAndSave(
    pageId: number,
    url: string,
    showTo: string,
  ): Promise<Evaluation> {
    const evaluation = await executeUrlEvaluation(url);

    const newEvaluation = await this.evaluationService.savePageEvaluation(
      pageId,
      evaluation,
    );

    return newEvaluation;
  }
}
