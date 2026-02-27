import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { createHash } from 'crypto';
import { WebsiteService } from 'src/website/website.service';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly websiteService: WebsiteService) {}

  private readonly headers = [
    "WebsiteId", "Name", "StartingUrl", "Declaration", "Declaration_Update_Date",
    "Stamp", "Stamp_Update_Date", "Creation_Date", "Entity", "Tags",
    "Directories", "numberOfPages", "averagePoints"
  ];

  async exportWebsitesToCsv(websiteIds: number[], response: Response) {
    const controller = new AbortController();
    const { signal } = controller;
     response.on('close', () => {
        if (!response.writableEnded) {
            controller.abort();
        }
    });

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename=export-${Date.now()}.csv`);
    
    response.write('\uFEFF');
    response.write(this.headers.join(';') + '\n');

    const batchSize = 1000;
    for (let i = 0; i < websiteIds.length; i += batchSize) {
    
      if (signal.aborted) return;
      const batchIds = websiteIds.slice(i, i + batchSize);
      const batchWebsites = await this.getWebsitesFromDatabase(batchIds);
    
    for (const site of batchWebsites) {
      const line = [
        site.WebsiteId,
        site.Name,
        site.StartingUrl,
        site.Declaration,
        site.Declaration_Update_Date,
        site.Stamp,
        site.Stamp_Update_Date,
        site.Creation_Date,
        this.formatList(site.entities, 'Long_Name'),
        this.formatList(site.tags, 'Name'),
        this.formatList(site.directories, 'Name'),
        site.Pages ?? 0,
        this.sanitizeScore(site.AverageScore)
      ].map(val => this.escapeCsvField(val)).join(';');

      response.write(line + '\n');
    }
    }
    

    response.end();
  }

  private escapeCsvField(value: any): string {
    const s = (value ?? "").toString().replace(/\r?\n/g, " ");
    return /[\n\r";]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  private formatList(list: any[], key: string): string {
    return (list || []).map(item => item?.[key] || item).filter(Boolean).join(';');
  }

  private sanitizeScore(score: any): number {
    return isNaN(score) || !isFinite(score) ? 0 : score;
  }

  
  private async getWebsitesFromDatabase(ids: number[]) {
    return await this.websiteService.findInfoAll(ids);
  }
}