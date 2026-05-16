import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { User } from "./user.entity";
import { Tag } from "src/domains/inventory/tag/tag.entity";
import { Role } from "./roles.entity";
import { RoleService } from "./role.service";
import { GovUser } from "../gov-user/entities/gov-user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Tag, Role, GovUser])],
  exports: [UserService, RoleService],
  providers: [UserService, RoleService],
  controllers: [UserController],
})
export class UserModule {}
