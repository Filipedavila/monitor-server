import { Injectable } from '@nestjs/common';
import { metrics, Counter, Histogram } from '@opentelemetry/api';

@Injectable()
export class TelemetryService {
  private readonly meter = metrics.getMeter('monitor-server-metrics');
  private readonly httpRequestsCounter: Counter;
  private readonly httpRequestDuration: Histogram;

  constructor() {

    this.httpRequestsCounter = this.meter.createCounter('http_requests_total', {
      description: 'Total number of HTTP requests',
    });

    this.httpRequestDuration = this.meter.createHistogram('http_request_duration_ms', {
      description: 'HTTP request duration in milliseconds',
      unit: 'ms',
    });
  }

  recordRequest(method: string, route: string, statusCode: number, durationMs: number) {
    const labels = { method, route, status: statusCode.toString() };
    
    this.httpRequestsCounter.add(1, labels);
    this.httpRequestDuration.record(durationMs, labels);
  }
}