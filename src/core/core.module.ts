import { Module } from "@nestjs/common";
import { AuthModule } from "./authentication/auth.module";
import { EventsModule } from "./events/events.module";
import { HealthModule } from "./health/heath.module";
import { LogModule } from "./log/log.module";
import { QueuesModule } from "./queues/queues.module";
import { AppLoggerModule } from "./app-logger/app-logger.module";
import { GlobalExceptionFilter } from "./filters/http-exception.filter";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ResponseTransformInterceptor } from "./interceptors/response.interceptor";


const modules = [
  QueuesModule,
  AuthModule,
  EventsModule,
  HealthModule,
  LogModule,
  AppLoggerModule,
];

@Module({
  imports: modules,
  exports: modules,
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter, 
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },

  ],
})
export class CoreModule {}
