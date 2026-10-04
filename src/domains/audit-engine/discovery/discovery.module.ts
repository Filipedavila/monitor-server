import { Module } from "@nestjs/common";
import { CrawlerWebsiteModule } from "./crawler-website/crawler-website.module";
import { CrawlerPageModule } from "./crawler-page/crawler-page.module";

@Module({
  imports: [
    CrawlerWebsiteModule,
    CrawlerPageModule,
  ],
  exports: [
    CrawlerWebsiteModule,
    CrawlerPageModule,
  ],
})
export class DiscoveryModule {}