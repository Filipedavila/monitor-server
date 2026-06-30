import { Module } from '@nestjs/common';
import { TagWebsitesModule } from './tag-websites/tag-websites.module';
import { UserWebsites } from './user-websites/user-websites.module';
import { TeamWebsitesModule } from './team-websites/team-websites.module';
import { TeamMembersModule } from './team-members/team-members.module';

@Module({
      imports: [TeamMembersModule, TeamWebsitesModule, UserWebsites, TagWebsitesModule],
      exports: [TeamMembersModule, TeamWebsitesModule, UserWebsites,TagWebsitesModule]
})
export class RelationsModule {}
