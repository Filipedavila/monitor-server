import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TracingInterceptor } from './interceptors/tracing.interceptor';
import { TelemetryService } from './telemetry.service';

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
    TelemetryService,
  ],
  exports: [TelemetryService],
})
export class TelemetryModule {}
