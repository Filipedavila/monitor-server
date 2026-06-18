import { Module } from '@nestjs/common';
import { ClickhouseModule } from 'src/core/clickhouse/clickhouse.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsOLAPRepository } from './analytics-olap.repository';
import { AnalyticsOLTPRepository } from './analytics-oltp.repository';

@Module({
    imports: [ClickhouseModule],
    controllers: [],
    providers: [AnalyticsService, AnalyticsOLAPRepository,AnalyticsOLTPRepository],
    exports: [AnalyticsService],

})
export class AnalyticsModule {}
