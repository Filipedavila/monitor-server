import { Module } from '@nestjs/common';
import { TagWebsitesModule } from './tag-websites/tag-websites.module';
import {  UserWebsitesModule } from './user-websites/user-websites.module';
import { TeamWebsitesModule } from './team-websites/team-websites.module';
import { TeamMembersModule } from './team-members/team-members.module';
import { DirectoryTagsModule } from './directory-tags/directory-tags.module';

@Module({
      imports: [TeamMembersModule, TeamWebsitesModule, UserWebsitesModule, TagWebsitesModule, DirectoryTagsModule],
      exports: [TeamMembersModule, TeamWebsitesModule, UserWebsitesModule, TagWebsitesModule,DirectoryTagsModule]
})
export class RelationsModule {}
