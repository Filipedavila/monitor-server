import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm/repository/Repository.js";
import { Outbox, OutboxStatus } from "src/core/outbox/outbox.entity";
import { FgaService } from "../fga.service";
interface AuthorizationJobData {
  outboxId: string;
  action: string;
  fgaTuple: {
    user: string;
    relation: string;
    object: string;
  };
}
@Processor("authorization-queue")
export class AuthorizationWorker extends WorkerHost {
  constructor(
        @InjectRepository(Outbox) private readonly outboxRepository: Repository<Outbox>,
        private readonly fgaService: FgaService
  ) {
    super();
  }
 
  async process(job: Job<AuthorizationJobData, any, string>): Promise<any> {
    switch (job.data.action) {
      case "create":
        await this.fgaService.createRelationship({
          user: job.data.fgaTuple.user,
          relation: job.data.fgaTuple.relation,
          object: job.data.fgaTuple.object,
        } as any);
        break;
      case "delete":
        await this.fgaService.deleteRelationship({
          user: job.data.fgaTuple.user,
          relation: job.data.fgaTuple.relation,
          object: job.data.fgaTuple.object,
        } as any);
        break;
     

      default:
        throw new Error(`No handler for job ${job.name}`);
    }
    return { success: true };
  }

  @OnWorkerEvent("active")
  async onActive(job: Job) {
    console.log(`🏃 Job ${job.id} começou a ser processado.`);
    await this.outboxRepository.update(job.data.outboxId, {
      status: OutboxStatus.PROCESSING
    });
  }

  @OnWorkerEvent("completed")
  async onCompleted(job: Job) {
    await this.outboxRepository.update(job.data.outboxId, {
      status: OutboxStatus.COMPLETED
    });
  }

  @OnWorkerEvent("failed")
  async onFailed(job: Job, error: Error) {
    console.error(`❌ Job ${job.id} falhou: ${error.message}`);
    await this.outboxRepository.update(job.data.outboxId, {
      status: OutboxStatus.FAILED,
    });
  }

}
