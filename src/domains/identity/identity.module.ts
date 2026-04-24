import { Module } from "@nestjs/common";
import { UserModule } from "./user/user.module";
import { OrganizationModule } from "./organization/organization.module";
import { GovUserModule } from "./gov-user/gov-user.module";

@Module({
  imports: [UserModule, OrganizationModule, GovUserModule],
  exports: [UserModule, OrganizationModule, GovUserModule],
})
export class IdentityModule {}
