import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InstitutionService } from "./institution.service";
import { Institution } from "./institution.entity";
import { InstitutionController } from "./institution.controller";
import { InstitutionRepository } from "./institution.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Institution])],
  exports: [InstitutionService],
  providers: [InstitutionService,InstitutionRepository],
  controllers: [InstitutionController],
})
export class InstitutionModule {}
