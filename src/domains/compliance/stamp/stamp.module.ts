import { Module } from '@nestjs/common';
import { WebsiteStampController } from './stamp.controller';
import { WebsiteStampService } from './stamp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsiteStamp } from './stamp.entity';

@Module({
    imports: [ TypeOrmModule.forFeature([WebsiteStamp]) ],
    controllers:[WebsiteStampController],
    exports:[WebsiteStampService ],
    providers:[ WebsiteStampService ]
})
export class StampModule {

}
