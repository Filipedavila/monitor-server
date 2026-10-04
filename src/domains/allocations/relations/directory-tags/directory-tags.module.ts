import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Directory } from 'src/domains/inventory/directory/directory.entity';
import { DirectoryTagsController } from './directory-tags.controller';
import { DirectoryTagsService } from './directory-tags.service';

@Module({
    imports: [TypeOrmModule.forFeature([Directory]),],
    controllers:[DirectoryTagsController],
    providers:[DirectoryTagsService]
})
export class DirectoryTagsModule {
    
}
