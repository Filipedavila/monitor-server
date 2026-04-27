import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppsDirectoryService } from "./apps-directory.service";
import { AppsDirectory } from "./apps-directory.entity";
import { AppsDirectoryController } from "./apps-directory.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([AppsDirectory])
  ],
  exports: [AppsDirectoryService],
  providers: [AppsDirectoryService],
  controllers: [AppsDirectoryController],
})
export class AppsDirectoryModule {}
