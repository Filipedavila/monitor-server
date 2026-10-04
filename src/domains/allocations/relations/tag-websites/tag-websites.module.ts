import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagWebsite } from './tag-website.entity';
import { TagWebsitesService } from './tag-website.service';
import { TagWebsitesController } from './tag-websites.controller';
import { Website } from 'src/domains/inventory/website/website.entity';
import { Tag } from 'src/domains/inventory/tag/tag.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TagWebsite, Tag, Website]),],
    providers: [TagWebsitesService],
    controllers: [TagWebsitesController],
    exports: [TagWebsitesService]
})
export class TagWebsitesModule {}
