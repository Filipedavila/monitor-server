import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccessLevelEntity } from "./entitities/access-level.entity";
import { AccessLevelProvider } from "./access-level.service";
import { AbilityFactory } from "./ablities/ability.factory";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AccessLevelEntity])],
  providers: [AccessLevelProvider, AbilityFactory],
  exports: [AccessLevelProvider, AbilityFactory],
})
export class SecurityAuthorizationModule {}
