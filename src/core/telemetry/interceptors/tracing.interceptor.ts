import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TelemetryService } from '../telemetry.service';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: TelemetryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const method = request.method;
    const route = request.route?.path || request.url;
    const startTime = performance.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = performance.now() - startTime;
          this.metricsService.recordRequest(method, route, response.statusCode, duration);
        },
        error: (err) => {
          const duration = performance.now() - startTime;
          const status = err.status || 500;
          this.metricsService.recordRequest(method, route, status, duration);
        },
      }),
    );
  }
}
