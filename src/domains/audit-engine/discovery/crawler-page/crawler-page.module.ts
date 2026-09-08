import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerPageController } from './crawler-page.controller';
import { CrawlerPage } from './crawler-page.entity';
import { CrawlerPageRepository } from './crawler-page.repository';
import { CrawlerPageService } from './crawler-page.service';
import { PageModule } from 'src/domains/inventory/page/page.module';
import { RepositoryTableConfig } from 'src/common/repositories/base-context';
import { CRAWLER_PAGE_CONTEXT_METADATA_CONFIG } from './crawler-page.constants';

export const CrawlerPageTableConfigProvider: Provider = {
  provide: CRAWLER_PAGE_CONTEXT_METADATA_CONFIG,
  useFactory: (): RepositoryTableConfig => ({
    mainTable: {
      table: 'crawler_pages',
      alias: 'cp',
      pk: 'id',
      fk: 'crawler_website_id',
    },
    contextTable: {
      table: 'crawler_websites_contexts',
      alias: 'cwc',
      pk: 'id',
      fk: 'crawler_id',
    },
    helperTable: {
      table: 'crawler_websites',
      alias: 'cw',
      pk: 'id',
      fk: 'website_id',
    },
    hasHelperTable: true,
  }),
};

@Module({
  imports: [TypeOrmModule.forFeature([CrawlerPage]), PageModule],
  controllers: [CrawlerPageController],
  providers: [CrawlerPageService, CrawlerPageRepository, CrawlerPageTableConfigProvider],
  exports: [CrawlerPageService, CrawlerPageRepository, CrawlerPageTableConfigProvider],
})
export class CrawlerPageModule {}
