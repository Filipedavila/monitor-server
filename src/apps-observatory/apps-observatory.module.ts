import { Module } from "@nestjs/common";
import { AppsObservatoryController } from "./apps-observatory.controller";
import { AppsObservatory } from "./apps-observatory.entity";
import { AppsObservatoryService } from "./apps-observatory.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([AppsObservatory])],
  exports: [AppsObservatoryService],
  controllers: [AppsObservatoryController],
  providers: [AppsObservatoryService],
})
export class AppsObservatoryModule {}
