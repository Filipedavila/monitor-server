import { Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { ClickhouseModule } from 'src/core/clickhouse/clickhouse.module';
import { EvaluationConsumer } from './evaluation.consumer';

@Module({
  imports: [RedisModule, ClickhouseModule],
  providers: [EvaluationConsumer],
})
export class EvaluationConsumerModule {}
