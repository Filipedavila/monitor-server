import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamWebsites } from './team-websites.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TeamWebsites])],
})
export class TeamWebsitesModule {}
