import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";
import { RateLimiterModule, RateLimiterGuard } from "nestjs-rate-limiter";
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
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigAppModule,
    EventEmitterModule.forRoot(),

    PersistenceModule,

    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "public"),
    }),
    RateLimiterModule.register({
      points: 1000,
    }),
    CoreModule,
    DomainsModule,
    IntegrationsModule,
    AuthorizationModule,
    ClickhouseModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
    MaxOffsetLimitConstraint,
  ],
})
export class AppModule {}
