import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamWebsites } from './team-websites.entity';
import { TeamWebsitesController } from './team-websites.controller';
import { TeamWebsitesService } from './team-websites.service';

@Module({
    imports: [TypeOrmModule.forFeature([TeamWebsites])],
    providers: [TeamWebsitesService],
    controllers: [TeamWebsitesController],
    exports: [],
})
export class TeamWebsitesModule {}
