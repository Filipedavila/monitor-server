import { Global, Module } from "@nestjs/common";
import { FgaService } from "./fga.service";
import { FgaClientProvider } from "./fga.provider";
import { BullModule } from "@nestjs/bullmq";
import { Outbox } from "../outbox/outbox.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthorizationWorker } from "./queue/authorization.queue";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Outbox]),
    BullModule.registerQueue({
      name: "authorization-queue",
    }),
  ],
  providers: [ FgaService, FgaClientProvider,AuthorizationWorker],
  exports: [ FgaService, FgaClientProvider ],
})
export class AuthorizationModule {}
