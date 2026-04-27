import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationService } from "./application.service";
import { Application } from "./application.entity";
import { ApplicationController } from "./application.controller";
import { AppsEvaluationModule } from "src/apps-evaluation/apps-evaluation.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
    AppsEvaluationModule,
  ],
  exports: [ApplicationService],
  providers: [ApplicationService],
  controllers: [ApplicationController],
})
export class ApplicationModule {}
