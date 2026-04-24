import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { DumpModule } from "./dump/dump.module";
import { EventsModule } from "./events/events.module";
import { HealthModule } from "./health/heath.module";
import { LogModule } from "./log/log.module";
import { QueuesModule } from "./queues/queues.module";
import { AppLoggerModule } from "./app-logger/app-logger.module";

const modules = [
  QueuesModule,
  AuthModule,
  DumpModule,
  EventsModule,
  HealthModule,
  LogModule,
  AppLoggerModule,
];

@Module({
  imports: modules,
  exports: modules,
})
export class CoreModule {}
