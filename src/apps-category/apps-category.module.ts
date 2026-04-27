import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppsCategoryService } from "./apps-category.service";
import { AppsCategory } from "./apps-category.entity";
import { AppsCategoryController } from "./apps-category.controller";

@Module({
  imports: [TypeOrmModule.forFeature([AppsCategory])],
  exports: [AppsCategoryService],
  providers: [AppsCategoryService],
  controllers: [AppsCategoryController],
})
export class AppsCategoryModule {}
