import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickHouseLogLevel, createClient } from '@clickhouse/client';
@Module({
    imports: [],
    providers: [
    
        {
            provide: 'CLICKHOUSE_CONNECTION',
            useFactory: async (configService: ConfigService) => {
                const client = createClient({
                    host: configService.get<string>('CLICKHOUSE_URI'),
                    username: configService.get<string>('CLICKHOUSE_USER'),
                    password: configService.get<string>('CLICKHOUSE_PASSWORD'),
                    database: configService.get<string>('CLICKHOUSE_DATABASE'),
                    log: {
                        level: configService.get<number>('CLICKHOUSE_LOG_LEVEL') || ClickHouseLogLevel.INFO,
                    }
                });
                return client;
            },
            inject: [ConfigService],
                
        }
    ],

    
    exports: ['CLICKHOUSE_CONNECTION'],
})
export class ClickhouseModule {
    
}
