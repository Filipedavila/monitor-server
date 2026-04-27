import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppsEntityService } from "./apps-entity.service";
import { AppsEntity } from "./apps-entity.entity";
import { AppsEntityController } from "./apps-entity.controller";

@Module({
  imports: [TypeOrmModule.forFeature([AppsEntity])],
  exports: [AppsEntityService],
  providers: [AppsEntityService],
  controllers: [AppsEntityController],
})
export class AppsEntityModule {}
