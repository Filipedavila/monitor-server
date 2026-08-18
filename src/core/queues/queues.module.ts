import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { QUEUE_NAMES, DEFAULT_JOB_OPTIONS } from "./queues.config";
import { ExpressAdapter } from "@bull-board/express/dist/ExpressAdapter";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("REDIS_HOST"),
          port: configService.get<number>("REDIS_PORT"),
        },
      }),
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.CRAWL_PRIVATE,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
      {
        name: QUEUE_NAMES.EVAL_PUBLIC,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
      {
        name: QUEUE_NAMES.EVAL_PUBLIC_DLQ 
      },
      {
        name: QUEUE_NAMES.EVAL_PRIVATE,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
      {
        name: QUEUE_NAMES.EVAL_PRIVATE_DQL 
      },
      {
        name: QUEUE_NAMES.CRAWL_PUBLIC,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
      { name: QUEUE_NAMES.AUTHORIZATION, defaultJobOptions: DEFAULT_JOB_OPTIONS },
    ),
    BullBoardModule.forFeature(
      { name: QUEUE_NAMES.CRAWL_PRIVATE, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.EVAL_PUBLIC, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.EVAL_PRIVATE, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.CRAWL_PUBLIC, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.AUTHORIZATION, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.EVAL_PUBLIC_DLQ, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.EVAL_PRIVATE_DQL, adapter: BullMQAdapter },
    ),
    BullBoardModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        route: configService.get<string>("BULL_BOARD_ROUTE") || "/admin/queues",
        adapter: ExpressAdapter,
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
