import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CrawlerCreateDTO } from '../crawler-website/dto/crawler-create.dto';
import { CrawlPagesResponseDTO } from './dto/crawler-page-response.dto';
import { CrawlerWebsiteImportDTO } from '../crawler-website/dto/cralwer-webiste-import.dto';

export const DiscoveryDocs = {
  controller: () =>
    applyDecorators(
      ApiTags('discovery/pages'),
      ApiBearerAuth(),
      ApiResponse({ status: 403, description: 'Forbidden' }),
    ),

  getCrawlPages: () =>
    applyDecorators(
      ApiOperation({ summary: 'Find all crawl pages with filters, sorts, and pagination' }),
      ApiResponse({ status: 200, description: 'Success', type: CrawlPagesResponseDTO }),
    ),

  importCrawlPages: () =>
    applyDecorators(
      ApiOperation({ summary: 'Import crawl pages from a file' }),
      ApiBody({ type: CrawlerCreateDTO }),
      ApiResponse({ status: 200, description: 'Success', type: Boolean }),
    ),

  importCrawlers: () =>
    applyDecorators(
      ApiOperation({ summary: 'Import pages from Crawlers' }),
      ApiBody({ type: CrawlerWebsiteImportDTO }),
      ApiResponse({ status: 200, description: 'Success', type: Boolean }),
    ),
  deleteCrawlPages: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete user crawl pages from a specific website' }),
      ApiBody({ type: CrawlerCreateDTO }),
      ApiResponse({ status: 200, description: 'Success', type: Boolean }),
    ),
};
