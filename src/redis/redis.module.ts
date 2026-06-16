import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './types';

@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return new Redis({
                    host: configService.get<string>('REDIS_HOST') || 'localhost',
                    port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
                    password: configService.get<string>('REDIS_PASSWORD'),
                    db: parseInt(configService.get<string>('REDIS_DB_BUFFER') || '1', 10),
                });
            },
        },
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule {
}
