import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContextService } from "./context.service";
import { Context } from "./context.identity";

@Module({
  imports: [TypeOrmModule.forFeature([Context])],
  providers: [ContextService],
  exports: [ContextService, TypeOrmModule],
})
export class ContextModule {}