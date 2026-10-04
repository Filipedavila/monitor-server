import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { User } from "./user.entity";
import { UserRepository } from "./repositories/user.repository";
import { RoleModule } from "../role/role.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]),RoleModule],
  exports: [UserService],
  providers: [UserRepository,UserService],
  controllers: [UserController],
})
export class UserModule {}
