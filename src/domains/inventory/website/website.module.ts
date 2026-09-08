import { forwardRef, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsiteService } from './website.service';
import { Website } from './website.entity';
import { Tag } from '../tag/tag.entity';
import { Page } from '../page/page.entity';
import { WebsiteController } from './website.controller';
import { AccessibilityStatementModule } from 'src/domains/compliance/accessibility-statement/accessibility-statement.module';
import { EvaluationModule } from 'src/domains/audit-engine/evaluation/evaluation.module';
import { WebsiteRepository } from './repositories/website.repository';
import { RepositoryTableConfig } from 'src/common/repositories/base-context';
import { WEBSITE_CONTEXT_METADATA_CONFIG } from './website.constants';

export const WebsiteTableConfigProvider: Provider = {
  provide: WEBSITE_CONTEXT_METADATA_CONFIG,
  useFactory: (): RepositoryTableConfig => ({
    mainTable: {
      table: 'websites',
      alias: 'w',
      pk: 'id',
      fk: 'website_id',
    },
    contextTable: {
      table: 'website_contexts',
      alias: 'website_context',
      pk: 'id',
      fk: 'website_id',
    },
    hasHelperTable: false,
  }),
};
@Module({
  imports: [
    TypeOrmModule.forFeature([Tag, Website, Page]),
    AccessibilityStatementModule,
    EvaluationModule,
  ],
  exports: [WebsiteService, TypeOrmModule, AccessibilityStatementModule, WebsiteRepository],
  providers: [WebsiteService, WebsiteRepository, WebsiteTableConfigProvider],
  controllers: [WebsiteController],
})
export class WebsiteModule {}
