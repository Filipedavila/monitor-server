import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagWebsite } from './tag-website.entity';
import { TagWebsitesService } from './tag-website.service';

@Module({
    imports: [TypeOrmModule.forFeature([TagWebsite])],
    providers: [TagWebsitesService],
    exports: [TagWebsitesService]
})
export class TagWebsitesModule {}
