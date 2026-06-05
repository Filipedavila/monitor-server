import { DashboardService } from './dashboard.service';
import { Module } from '@nestjs/common';
import { DashboardResolver } from './dashboard.resolver';
import { ClickhouseModule } from 'src/core/clickhouse/clickhouse.module';

@Module({
    imports:[ClickhouseModule],
    exports:[],
    providers:[DashboardService, DashboardResolver],
})
export class DashboardModule {}