import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrganizationService } from "./organization.service";
import { Organization } from "./organization.entity";
import { OrganizationController } from "./organization.controller";
import { OrganizationRepository } from "./organization.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  exports: [OrganizationService],
  providers: [OrganizationService,OrganizationRepository],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
