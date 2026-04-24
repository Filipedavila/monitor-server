import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { User } from "./user.entity";
import { Tag } from "src/domains/inventory/tag/tag.entity";
import { Role } from "./roles.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Tag, Role])],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
