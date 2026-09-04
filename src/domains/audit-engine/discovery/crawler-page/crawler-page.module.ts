import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerPageController } from './crawler-page.controller';
import { CrawlerPage } from './crawler-page.entity';
import { CrawlerPageRepository } from './crawler-page.repository';
import { CrawlerPageService } from './crawler-page.service';
import { PageModule } from 'src/domains/inventory/page/page.module';

@Module({
  imports: [TypeOrmModule.forFeature([CrawlerPage]), PageModule],
  controllers: [CrawlerPageController],
  providers: [CrawlerPageService, CrawlerPageRepository],
  exports: [CrawlerPageService, CrawlerPageRepository],
})
export class CrawlerPageModule {}
