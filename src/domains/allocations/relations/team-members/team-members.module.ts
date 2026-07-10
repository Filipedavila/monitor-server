import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMembers } from './team-members.entity';
import { TeamMembersService } from './team-members.service';
import { TeamMembersController } from './team-members.controller';

@Module({
    imports: [TypeOrmModule.forFeature([TeamMembers])],
    controllers: [TeamMembersController],
    providers: [TeamMembersService],
    exports: [],
})
export class TeamMembersModule {}
