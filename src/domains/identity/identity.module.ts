import { Module } from "@nestjs/common";
import { UserModule } from "./user/user.module";
import { TeamModule } from "./team/team.module";
import { RoleModule } from "./role/role.module";


@Module({
  imports: [RoleModule,UserModule, TeamModule ],
  exports: [RoleModule, UserModule, TeamModule],
})
export class IdentityModule {}
