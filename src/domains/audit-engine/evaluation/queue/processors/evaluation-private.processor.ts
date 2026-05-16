import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { executeUrlEvaluation } from "../../util/middleware";
import { EvaluationService } from "../../services/evaluation.service";
import { Evaluation } from "../../entities/evaluation.entity";
import { InjectRepository } from "@nestjs/typeorm";
  
import { Repository } from "typeorm";
import { Page } from "src/domains/inventory/page/page.entity";
interface EvaluationJobData {
  websiteId: number;
  evaluationId: number;
  pageId: number;
  url?: string;
  userId: number;
}
@Processor("evaluation-queue-private")
export class EvaluationPrivateWorker extends WorkerHost {
  constructor(
    private readonly evaluationService: EvaluationService,
    @InjectRepository(Page) private readonly pageRepository: Repository<Page>,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }
 
  async process(job: Job<EvaluationJobData, any, string>): Promise<any> {
    switch (job.name) {
      case "evaluation-job":
        console.log(
          "Processing evaluation job for websiteId:",
          job.data.websiteId,

        );
        return await this.evaluatePageAndSave(
          job.data.websiteId, 
         job.data.evaluationId,
         job.data.pageId,
         job.data.userId
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
    console.log(`Job ${job.id} terminou com sucesso!`);
    this.eventEmitter.emit("crawl.success", job.data);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, error: Error) {
    console.error(` Job ${job.id} falhou: ${error.message}`);
  }

  async evaluatePageAndSave(
    websiteId: number,
    evaluationId: number,
    pageId: number,
    userId: number,
    url?:string,
  ): Promise<Evaluation> {
    let urlToEvaluate = url;
    if (!urlToEvaluate) {
      const page = await this.pageRepository.findOne({ where: { id: pageId } });
      if (!page) {
        throw new Error(`Page with ID ${pageId} not found`);
      }
      urlToEvaluate = page.url;
    }
    const evaluation = await executeUrlEvaluation(urlToEvaluate);

    const newEvaluation = await this.evaluationService.savePageEvaluation(
      websiteId,
      evaluationId,
      pageId,
      evaluation,
      userId,
    );

    return newEvaluation;
  }
}
