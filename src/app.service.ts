import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger('Bootstrap');
  constructor(private configService: ConfigService) {}
  onModuleInit() {
    const nodeEnv = this.configService.get('NODE_ENV');
    const authMethod = this.configService.get('APP_AUTH_METHOD');
    const secretKey = this.configService.get('SECRET_KEY');
    const redisHost = this.configService.get('REDIS_HOST');
    const redisPort = this.configService.get('REDIS_PORT');
    const bullBoardRoute = this.configService.get('BULL_BOARD_ROUTE');
    const dbHost = this.configService.get('DB_HOST');
    const dbPort = this.configService.get('DB_PORT');
    const dbUsername = this.configService.get('DB_USERNAME');
    const dbDatabase = this.configService.get('DB_DATABASE');
    const paginationMaxLimit = this.configService.get('PAGINATION_MAX_LIMIT');
    const paginationDefaultLimit = this.configService.get('PAGINATION_DEFAULT_LIMIT');
    const ipBlacklistRanges = this.configService.get('IP_BLACKLIST_RANGES');
    const fgaApiUrl = this.configService.get('FGA_API_URL');
    const fgaStoreId = this.configService.get('FGA_STORE_ID');
    const fgaModelId = this.configService.get('FGA_MODEL_ID');
    const configs = [
      { label: 'NODE_ENV', value: nodeEnv },
      { label: 'AUTH_METHOD', value: authMethod },
      { label: 'SECRET_KEY', value: secretKey ? '✅ PRESENT' : '❌ MISSING' },
      { label: 'REDIS_HOST', value: redisHost },
      { label: 'REDIS_PORT', value: redisPort },
      { label: 'BULL_BOARD_ROUTE', value: bullBoardRoute },
      { label: 'DB_HOST', value: dbHost },
      { label: 'DB_PORT', value: dbPort },
      { label: 'DB_USERNAME', value: dbUsername },
      { label: 'DB_DATABASE', value: dbDatabase },
      { label: 'PAGINATION_MAX_LIMIT', value: paginationMaxLimit },
      { label: 'PAGINATION_DEFAULT_LIMIT', value: paginationDefaultLimit },
      {
        label: 'IP_BLACKLIST_RANGES',
        value: ipBlacklistRanges ? '✅ PRESENT' : '❌ NONE PROVIDED',
      },
      { label: 'FGA_API_URL', value: fgaApiUrl },
      { label: 'FGA_STORE_ID', value: fgaStoreId ? '✅ PRESENT' : '❌ MISSING' },
      { label: 'FGA_MODEL_ID', value: fgaModelId ? '✅ PRESENT' : '❌ MISSING' },
    ];

    this.logger.log('┌──────────────────────────────────────────┐');
    this.logger.log('│          CONFIGURATION AUDIT             │');
    this.logger.log('├──────────────────────────────────────────┤');
    configs.forEach((config) => {
      this.logger.log(`│ ${config.label.padEnd(16)} : ${String(config.value).padEnd(20)} │`);
    });
    this.logger.log('└──────────────────────────────────────────┘');
  }
}
