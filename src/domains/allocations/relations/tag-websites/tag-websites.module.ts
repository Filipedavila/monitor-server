import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagWebsite } from './tag-website.entity';
import { TagWebsitesService } from './tag-website.service';
import { TagWebsitesController } from './tag-websites.controller';

@Module({
    imports: [TypeOrmModule.forFeature([TagWebsite])],
    providers: [TagWebsitesService],
    controllers: [TagWebsitesController],
    exports: [TagWebsitesService]
})
export class TagWebsitesModule {}
