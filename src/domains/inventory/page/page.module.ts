import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageService } from './page.service';
import { Page } from './page.entity';
import { PageController } from './page.controller';
import { AuthModule } from '../../../core/authentication/auth.module';
import { EvaluationModule } from 'src/domains/audit-engine/evaluation/evaluation.module';
import { Website } from '../website/website.entity';
import { Evaluation } from 'src/domains/audit-engine/evaluation/entities/evaluation.entity';
import { AccessibilityStatementModule } from 'src/domains/compliance/accessibility-statement/accessibility-statement.module';
import { PageRepository } from './page.repository';
import { PageContext } from './page-contexts.entity';
import {
  BASE_CONTEXT_CONFIG_TOKEN,
  RepositoryTableConfig,
} from 'src/common/repositories/base-context';

const PageTableConfigProvider: Provider = {
  provide: BASE_CONTEXT_CONFIG_TOKEN,
  useFactory: (): RepositoryTableConfig => ({
    mainTable: {
      table: 'page',
      alias: 'p',
      pk: 'id',
      fk: 'page_id',
    },
    contextTable: {
      table: 'page_contexts',
      alias: 'pc',
      pk: 'id',
      fk: 'page_id',
    },
    hasHelperTable: false,
  }),
};
@Module({
  imports: [
    TypeOrmModule.forFeature([Website, Page, Evaluation, PageContext]),
    AuthModule,
    EvaluationModule,
    AccessibilityStatementModule,
  ],
  exports: [PageService, PageTableConfigProvider],
  providers: [PageService, PageRepository, PageTableConfigProvider],

  controllers: [PageController],
})
export class PageModule {}
