import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CrawlerCreateDTO } from './dto/crawler-create.dto';
import { CrawlerImportDTO } from './dto/crawler-import.dto';
import { CrawlWebsitesResponseDTO } from './dto/crawler-website-response.dto';

export const DiscoveryDocs = {
  controller: () =>
    applyDecorators(
      ApiTags('discovery'),
      ApiBearerAuth(),
      ApiResponse({ status: 403, description: 'Forbidden' }),
    ),

  getCrawlWebsites: () =>
    applyDecorators(
      ApiOperation({ summary: 'Find all crawl websites with filters, sorts, and pagination' }),
      ApiResponse({ status: 200, description: 'Success', type: CrawlWebsitesResponseDTO }),
    ),

  crawlWebsite: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create a new crawl' }),
      ApiBody({ type: CrawlerCreateDTO }),
      ApiResponse({ status: 202, description: 'Accepted ' }),
    ),

  importCrawlers: () =>
    applyDecorators(
      ApiBody({ type: CrawlerImportDTO }),
      ApiOperation({ summary: 'Import crawlers from an external source' }),
      ApiResponse({ status: 200, description: 'Success', type: Boolean }),
    ),
  deleteCrawler: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete specific crawl' }),
      ApiResponse({ status: 200, description: 'Success', type: Boolean }),
    ),
};
