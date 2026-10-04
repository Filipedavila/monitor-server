import { Module } from '@nestjs/common';
import { UserWebsite } from './user-websites.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserWebsitesService } from './user-websites.service';
import { UserWebsitesController } from './user-websites.controller';

@Module({
    imports: [TypeOrmModule.forFeature([UserWebsite])],
    exports: [],
    providers: [UserWebsitesService],
    controllers: [UserWebsitesController],
})
export class UserWebsitesModule {}
