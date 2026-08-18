import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, Queue } from "bullmq";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EvaluationStatus } from "../../entities/evaluation.entity";

import { QUEUE_NAMES } from "src/core/queues/queues.config";
import { EvaluationStorage } from "../../types/evaluation-storage.interface";
import { EvaluationEngine } from "../../types/evaluation-engine.interface";
import { EvaluationParserService } from "../../evaluation-parser.service";
import { EvaluationRepository } from "../../evaluation.repository";
import { EvaluationJobData } from "../../types";
import { Inject } from "@nestjs/common";

@Processor(QUEUE_NAMES.EVAL_PUBLIC, {
  concurrency: 10, 
})
export class EvaluationPublicWorker extends WorkerHost {
  constructor(
       @InjectQueue(QUEUE_NAMES.EVAL_PUBLIC_DLQ) 
        private readonly dldqueue: Queue,
        @Inject(EvaluationEngine)
        private readonly evaluationEngine: EvaluationEngine,
        @Inject(EvaluationStorage)
        private readonly evaluationStore: EvaluationStorage,
        @Inject(EvaluationParserService)
        private readonly evaluationParser:EvaluationParserService,
        private readonly evaluationRepository:EvaluationRepository,

        private eventEmitter: EventEmitter2,
  ) {
    super();
  }
 
 async process(job: Job<EvaluationJobData, void, string>): Promise<any> {
        const {evaluationId,websiteId,pageId,url} = job.data;

        const evaluationResult = await this.evaluationEngine.evaluate(
           url
         );
         job.updateProgress(50);
         job.log("Received Evaluation from Engine")
         const {data,pagecode,evaluationData} =  this.evaluationParser.parseEvaluation(evaluationResult);
         const evaluationDate = data.date;

         this.evaluationStore.save(
          {
            htmlContent:pagecode,
            nodes:data.nodes,
            evalIdentifier:{
            evaluationId,
            websiteId,
            pageId,
            evaluationDate

          }}
         )
         job.log("Saved compressed files in  Storage")
         job.updateProgress(70);

         await this.evaluationRepository.updateEntityFromRawData(evaluationId,evaluationData);
         job.updateProgress(100);
         job.log("Evaluation Resolution Ended")
         await this.evaluationRepository.updateStatus(evaluationId, EvaluationStatus.COMPLETED);


       
   }

  @OnWorkerEvent("active")
  onActive(job: Job) {
    console.log(`🏃 Job ${job.id} começou a ser processado.`);
     this.eventEmitter.emit("evaluation.active", job.data);
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    console.log(`Job ${job.id} terminou com sucesso!`);
    this.eventEmitter.emit("evaluation.completed", job.data);
  }

  @OnWorkerEvent("failed")
  async onFailed(job: Job, error: Error) {
    if(job.attemptsMade < 3){
      job.retry()
    }else{
      await this.dldqueue.add('failed-job',job)
      await this.evaluationRepository.updateStatus(job.data.evaluationId, EvaluationStatus.FAILED);

      this.eventEmitter.emit("evaluation.failed", { jobData: job.data, error: error.message });
      console.error(` Job ${job.id} falhou: ${error.message}`);
    }
  } 
}
