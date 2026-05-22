import {Module} from "@nestjs/common";
import { RoleService } from "./role.service";
import { Role } from "./roles.entity";
import { TypeOrmModule } from "@nestjs/typeorm";


@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  exports: [RoleService],
  providers: [RoleService],
  controllers: [],
})
export class RoleModule {}


