import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';
import { RedisModule } from 'src/redis/redis.module';
import { AppCacheService } from './cache.service';

@Module({
  imports: [
    RedisModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST') ?? '127.0.0.1';
        const port = Number(configService.get('REDIS_PORT') ?? 6379);
        const password = configService.get<string>('REDIS_PASSWORD');
        const db = Number(configService.get('REDIS_DB_MONITOR') ?? 1);

        const auth = password ? `:${encodeURIComponent(password)}@` : '';
        const redisUrl = `redis://${auth}${host}:${port}/${db}`;

        return {
          stores: [createKeyv(redisUrl)],
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AppCacheService],
  exports: [AppCacheService],
})
export class AppCacheModule {}
