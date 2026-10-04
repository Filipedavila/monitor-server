import { Module } from '@nestjs/common';
import { ClickhouseModule } from 'src/core/clickhouse/clickhouse.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticRepository } from './analytics.repository';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [ClickhouseModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticRepository],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
