import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { IntegrationsModule } from "./integrations/integrations.module";
import { CoreModule } from "./core/core.module";
import { DomainsModule } from "./domains/domains.module";
import { ConfigAppModule } from "./core/config-app/config-app.module";
import { PersistenceModule } from "./core/database/persistence.module";
import { AuthorizationModule } from "./core/authorization/authorization.module";
import { MaxOffsetLimitConstraint } from "./core/validators/max-limit-pag.validator";
import { ClickhouseModule } from "./core/clickhouse/clickhouse.module"; 
import { DashboardModule } from "./dashboard/dashboard.module";
import { HybridRateLimiterGuard } from "./common/guards/hybrid-rate-limiter.guard";
import { ThrottlerModule } from "@nestjs/throttler/dist/throttler.module";
import { ConfigService } from '@nestjs/config';
@Module({
  imports: [
    ConfigAppModule,
    EventEmitterModule.forRoot(),

    PersistenceModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req }) => ({ req }),
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "public"),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigAppModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isEnabled = configService.get<boolean>('RATE_LIMIT_ENABLED');
        const ttl = configService.get<number>('RATE_LIMIT_TTL');
        const limit = configService.get<number>('RATE_LIMIT_LIMIT');
        
        return {
          throttlers: [
            {
              name: 'global',
              ttl: ttl ?? 60000,
              limit: isEnabled ? (limit ?? 100) : 1000000000,
            },
          ],
        };
      },
    }),
    CoreModule,
    DomainsModule,
    IntegrationsModule,
    AuthorizationModule,
    ClickhouseModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: HybridRateLimiterGuard,
    },
    MaxOffsetLimitConstraint,
  ],
})
export class AppModule {}
