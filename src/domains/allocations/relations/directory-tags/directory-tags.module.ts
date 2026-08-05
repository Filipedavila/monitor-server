import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Directory } from 'src/domains/inventory/directory/directory.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Directory]),],
    controllers:[],
    providers:[]
})
export class DirectoryTagsModule {
    
}
