import { metrics } from '@opentelemetry/api';

export function TrackMetric(metricName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const meter = metrics.getMeter('monitor-server-metrics');
    const counter = meter.createCounter(`${metricName}_total`);
    const histogram = meter.createHistogram(`${metricName}_duration_ms`);

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      counter.add(1, { method: propertyKey });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;
        histogram.record(duration, { method: propertyKey, status: 'success' });
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        histogram.record(duration, { method: propertyKey, status: 'error' });
        throw error;
      }
    };

    return descriptor;
  };
}
