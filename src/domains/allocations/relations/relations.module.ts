import { Module } from '@nestjs/common';
import { TagWebsitesModule } from './tag-websites/tag-websites.module';
import {  UserWebsitesModule } from './user-websites/user-websites.module';
import { TeamWebsitesModule } from './team-websites/team-websites.module';
import { TeamMembersModule } from './team-members/team-members.module';

@Module({
      imports: [TeamMembersModule, TeamWebsitesModule, UserWebsitesModule, TagWebsitesModule],
      exports: [TeamMembersModule, TeamWebsitesModule, UserWebsitesModule, TagWebsitesModule]
})
export class RelationsModule {}
