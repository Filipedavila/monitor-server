import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TeamService } from "./team.service";
import {  Team } from "./team.entity";
import {  TeamController } from "./team.controller";
import { TeamRepository } from "./repository/team.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Team])],
  exports: [TeamService],
  providers: [TeamService, TeamRepository],
  controllers: [TeamController],
})
export class TeamModule {}
