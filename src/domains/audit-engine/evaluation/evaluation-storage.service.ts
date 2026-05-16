import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { join, normalize } from 'node:path';
import * as crypto from 'node:crypto';
import { createGzip } from 'node:zlib';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import * as cheerio from 'cheerio';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';

interface EvaluationFileMetadata {
  timestamp: string;
  storageReference: string;
  integrityHash: string;
}
export interface EvaluationIdentifier {
  evaluationId: number;
  websiteId: string;
  pageId: string;
  date: string;
}
@Injectable()
export class EvaluationStorageService {
  private readonly BASE_PATH = normalize(join(process.cwd(), 'storage/evaluations'));

  constructor(private readonly logger: AppLoggerService) {
    
    fs.mkdir(this.BASE_PATH, { recursive: true }).catch(err => {
      this.logger.error('Failed to create base storage directory:', err);
    });
  }

  async saveEvaluation(
    evalIdentifier: EvaluationIdentifier,
    htmlContent: string,
    nodes: any,
  ):Promise<EvaluationFileMetadata> {
    const dateFolder = new Date().toISOString().split('T')[0];

    const safeWebId = evalIdentifier.websiteId.replace(/[^a-z0-9_-]/gi, '');
    const safePageId = evalIdentifier.pageId.replace(/[^a-z0-9_-]/gi, '');

    const targetDir = join(this.BASE_PATH, dateFolder, safeWebId);
    const fileName = `${safePageId}_${evalIdentifier.evaluationId}.html`;
    const filenameNodes = `${safePageId}_${evalIdentifier.evaluationId}_nodes.json`;
    

    const fullPath = join(targetDir, fileName);
    const fullPathNodes = join(targetDir, filenameNodes);
    const sanitizedHtml= this.cleanHtml(htmlContent);
    try {
      await fs.mkdir(targetDir, { recursive: true });

      const hash = crypto.createHash('sha256').update(sanitizedHtml).digest('hex');
      const hashNodes = crypto.createHash('sha256').update(JSON.stringify(nodes)).digest('hex');

      await this.saveAsGzip( sanitizedHtml , join(targetDir, `${safePageId}_${evalIdentifier.evaluationId}.html`));

         await fs.writeFile(`${fullPathNodes}.sha256`, hashNodes, 'utf8');
     await this.saveAsGzip( nodes , join(targetDir, `${safePageId}_${evalIdentifier.evaluationId}_nodes.json`));

     return {
        timestamp: new Date().toISOString(),
        storageReference: fullPath,
        integrityHash: hash
     };

    } catch (error) {
      throw error;
    }
  }

  async saveAsGzip(data: any, fullPath: string): Promise<void> {
    const storagePath = `${fullPath}.gz`;
    
    const sourceStream = Readable.from([JSON.stringify(data)]);
    
    const gzip = createGzip();
    
    const destination = createWriteStream(storagePath);

    try {
      await pipeline(sourceStream, gzip, destination);
      this.logger.log(`File saved ${storagePath} successfully.`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Failed to compress/write file for evaluation:', error.message);
      throw error;
    }
  }

  public async getEvaluationNodesPath(query:EvaluationIdentifier): Promise<string> {
  const safeWebId = query.websiteId.replace(/[^a-z0-9_-]/gi, '');
  const safePageId = query.pageId.replace(/[^a-z0-9_-]/gi, '');
  const targetDir = join(this.BASE_PATH, query.date, safeWebId);
  const fileName = `${safePageId}_${query.evaluationId}_nodes.json.gz`;
  const fullPath = join(targetDir, fileName);

  try {
    await fs.access(fullPath, fs.constants.R_OK);
    return fullPath;
  } catch (error) {
    throw new NotFoundException(`File not found for Website ID: ${query.websiteId}, Page ID: ${query.pageId}, Date: ${query.date}`);
  }
}
  public async getEvaluationHtmlPath(query: EvaluationIdentifier): Promise<string> {
  const safeWebId = query.websiteId.replace(/[^a-z0-9_-]/gi, '');
  const safePageId = query.pageId.replace(/[^a-z0-9_-]/gi, '');
  const targetDir = join(this.BASE_PATH, query.date, safeWebId);
  const fileName = `${safePageId}_${query.evaluationId}.html.gz`;
  const fullPath = join(targetDir, fileName);

  try {
    await fs.access(fullPath, fs.constants.R_OK);
    return fullPath;
  } catch (error) {
    throw new NotFoundException(`File not found for Website ID: ${query.websiteId}, Page ID: ${query.pageId}, Date: ${query.date}`);
  }
} 
cleanHtml(html: string): string {
    if (!html) return '';
    const $ = cheerio.load(html);
    $('head script, head style').remove();
    return $.html();
  }
}