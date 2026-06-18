import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm/repository/Repository.js";
import { Outbox, OutboxStatus } from "src/core/outbox/outbox.entity";
import { FgaService } from "../fga.service";
import {   ResourcePayloadMap } from "./payload.types";
import { AuthorizationRegistry } from "../registry/authorization.registry";
export interface AuthorizationJobData<T extends keyof ResourcePayloadMap> {
  outboxId: string;
  action: 'create' | 'delete'; 
  payload: ResourcePayloadMap[T];
  resourceType: T;
}
@Processor("authorization-queue")
export class AuthorizationWorker extends WorkerHost {
  constructor(
        @InjectRepository(Outbox) private readonly outboxRepository: Repository<Outbox>,
        private readonly registry: AuthorizationRegistry
  ) {
    super();
  }
 
  async process(job: Job<AuthorizationJobData<keyof ResourcePayloadMap>, any, string>): Promise<any> {
    console.log(`Processing job ${job.id} with data:`, JSON.stringify(job.data, null, 2));
    const payload = job.data.payload;
    await this.registry.execute(payload.resourceType, payload, );

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
