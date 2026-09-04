import { Logger, Module } from '@nestjs/common';
import { ObservatoryController } from './observatory.controller';
import { ObservatoryService } from './observatory.service';
import { AnalyticsModule } from 'src/domains/analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  exports: [ObservatoryService],
  controllers: [ObservatoryController],
  providers: [ObservatoryService, Logger],
})
export class ObservatoryModule {}
