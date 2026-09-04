import { ClickHouseClient } from '@clickhouse/client';
import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { CLICKHOUSE_CLIENT } from 'src/core/clickhouse/clickhouse.constants';
import { REDIS_CLIENT, REDIS_STREAMS,REDIS_GROUPS, ConsumerName } from 'src/redis/types';

export interface EvaluationResult {
  evaluation_id: number;
  institution_id: number; 
  directory_id: number;
  website_id: number;
  page_id: number;
  evaluation_date: string;
  rules_counts:Record<string,number>;
  score: number;
}
interface BufferEvalution {
  redis_ids: string[]; 
  data: EvaluationResult[];
}

@Injectable()
export class EvaluationConsumer implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis,
             @Inject(CLICKHOUSE_CLIENT) private readonly clickhouse: ClickHouseClient ) {}
  private running = true;
  private flushInterval = 5000;

  async onModuleInit() {
    await this.ensureGroup();
    this.start();
  }

  private async ensureGroup() {
    try {
      await this.redis.xgroup(
        'CREATE',
        REDIS_STREAMS.ANALYTICS_EVALUATION_BUFFER,
        REDIS_GROUPS.ANALYTICS_EVALUATION_GROUP,
        '$',
        'MKSTREAM',
      );
    } catch (e: any) {
      if (!e.message.includes('BUSYGROUP')) throw e;
    }
  }

    private start() {
        this.loop();
    }
   private async loop() {
  const CONSUMER_NAME: ConsumerName = `analytics-evaluation-${process.pid}`;
  const buffer: BufferEvalution = { redis_ids: [], data: [] };
  let lastFlush = Date.now();

  while (this.running) {

    const data = await this.redis.xreadgroup(
      'GROUP', REDIS_GROUPS.ANALYTICS_EVALUATION_GROUP, CONSUMER_NAME,
      'COUNT', 500, 'BLOCK', 2000,
      'STREAMS', REDIS_STREAMS.ANALYTICS_EVALUATION_BUFFER, '>'
    ) as any;

    if (!data) continue;

    const [_, entries] = data[0];
    const bufferEntries:BufferEvalution = entries.reduce((acc: BufferEvalution, [id, fields]: [string, string]) => {
      
      acc.redis_ids.push(id);
      acc.data.push(JSON.parse(fields[1]) as EvaluationResult);
      return acc;
    }, { redis_ids: [], data: [] });


    buffer.redis_ids.push(...bufferEntries.redis_ids);
    buffer.data.push(...bufferEntries.data);

    const now = Date.now();
    if (buffer.redis_ids.length >= 1000 || (buffer.redis_ids.length > 0 && now - lastFlush >= this.flushInterval)) {
      await this.flush(buffer);
      buffer.redis_ids = [];
      buffer.data = [];
      lastFlush = Date.now();
    }
  }
}

private async flush(buffer: BufferEvalution) {
  try {
    await this.clickhouse.insert({
      table: 'evaluations_temp',
      values: buffer.data, 
      format: 'JSONEachRow',
    });

    const ids = buffer.redis_ids;
    await this.ack(ids);
    console.log(`Batch de ${ids.length} inserido e confirmado.`);
  } catch (error) {
    console.error('Falha crítica no insert do ClickHouse:', error);
   
  }
}
private async ack(ids: string[]) {
    if (ids.length === 0) return;
  await this.redis.xack(
    REDIS_STREAMS.ANALYTICS_EVALUATION_BUFFER,
    REDIS_GROUPS.ANALYTICS_EVALUATION_GROUP,
    ...ids,
  );
}
async onModuleDestroy() {
  this.running = false;
}
}