import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrganizationService } from "./organization.service";
import { Organization } from "./organization.entity";
import { OrganizationController as OrganizationController } from "./organization.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  exports: [OrganizationService],
  providers: [OrganizationService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
