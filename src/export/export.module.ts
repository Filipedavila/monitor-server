import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { WebsiteModule } from 'src/website/website.module';

@Module({
  controllers: [ExportController],
  providers: [ExportService],
  imports: [WebsiteModule],
})
export class ExportModule {}
