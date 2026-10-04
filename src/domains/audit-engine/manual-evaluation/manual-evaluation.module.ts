import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManualEvaluation } from './manual-evaluation.entity';
import { ManualEvaluationService } from './manual-evaluation.service';
import { ManualEvaluationController } from './manual-evaluation.controller';
import { Website } from '../../inventory/website/website.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ManualEvaluation, 
      Website
    ]),
  ],
  controllers: [
    ManualEvaluationController
  ],
  providers: [
    ManualEvaluationService
  ],
  exports: [
    ManualEvaluationService
  ],
})
export class ManualEvaluationModule {}