import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMembers } from './team-members.entity';
import { TeamMembersService } from './team-members.service';

@Module({
    imports: [TypeOrmModule.forFeature([TeamMembers])],
    providers: [TeamMembersService],
    exports: [TeamMembersService],
})
export class TeamMembersModule {}
