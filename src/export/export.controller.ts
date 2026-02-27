import { Controller, Post, Body, Res, UseInterceptors, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt-admin'))
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('websites/csv')
  async downloadWebsites(@Body('ids') ids: number[], @Res() res: Response) {
    if (!ids || ids.length === 0) {
      return res.status(400).send('Nenhum ID fornecido');
    }
    /*
    const cacheKey = createHash('sha256')
      .update(JSON.stringify(ids.sort()))
      .digest('hex');

    const cachePath = join(__dirname, '../../cache', `${cacheKey}.csv`);
    
    if (existsSync(cachePath)) {
      return res.sendFile(cachePath);
    }*/

    return this.exportService.exportWebsitesToCsv(ids, res);
  }
}