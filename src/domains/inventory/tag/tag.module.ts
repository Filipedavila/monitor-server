import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TagService } from "./tag.service";
import { Tag } from "./tag.entity";
import { TagController } from "./tag.controller";
import { TagRepository } from "./tag.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Tag])],
  exports: [TagService],
  providers: [TagService,TagRepository],
  controllers: [TagController],
})
export class TagModule {}
