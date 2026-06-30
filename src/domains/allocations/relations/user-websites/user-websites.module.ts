import { Module } from '@nestjs/common';
import { UserWebsite } from './user-websites.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([UserWebsite])],
    exports: [],
    providers: [],
    controllers: [],
})
export class UserWebsites {}
