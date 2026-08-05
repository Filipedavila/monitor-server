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
import { EvaluationIdentifier, EvaluationFileMetadata } from './types';

interface SafePaths {
  targetDir: string;
  safeWebsiteId: string;
  safePageId: string;
  baseFileName: string;
}


@Injectable()
export class EvaluationStorageService {
  private readonly BASE_PATH = normalize(join(process.cwd(), 'storage/evaluations'));
  private readonly HTML_FILE_SUFFIX = '.html.gz';
  private readonly HMTL_FILE_HASH_SUFFIX = '.html.sha256';
  private readonly NODES_FILE_SUFFIX = '_nodes.json.gz';
  private readonly HASH_FILE_SUFFIX = '_nodes.json.sha256';

  constructor(private readonly logger: AppLoggerService) {
    
    fs.mkdir(this.BASE_PATH, { recursive: true }).catch(err => {
      this.logger.error('Failed to create base storage directory:', err);
    });
  }

  private buildSafePaths(evalIdentifier: EvaluationIdentifier): SafePaths {
    const safeWebsiteId = evalIdentifier.websiteId.replace(/[^a-z0-9_-]/gi, '');
    const safePageId = evalIdentifier.pageId.replace(/[^a-z0-9_-]/gi, '');
    const targetDir = join(this.BASE_PATH, evalIdentifier.evaluationDate, safeWebsiteId);
    const baseFileName = `${safePageId}_${evalIdentifier.evaluationId}`;

    return { targetDir, safeWebsiteId, safePageId, baseFileName };
  }

  private computeHash(data: string, evalIdentifier: EvaluationIdentifier,): string {
    return crypto.createHash('sha256').update(data + evalIdentifier.evaluationDate + evalIdentifier.websiteId + evalIdentifier.pageId).digest('hex');
  }


  async saveEvaluation(
    evalIdentifier: EvaluationIdentifier,
    htmlContent: string,
    nodes: any,
  ): Promise<void> {
    const { targetDir, baseFileName } = this.buildSafePaths(evalIdentifier);
    
    
    const sanitizedHtml = this.cleanHtml(htmlContent);
    const htmlHash = this.computeHash(sanitizedHtml, evalIdentifier);
    const nodesHash = this.computeHash(JSON.stringify(nodes), evalIdentifier);

    try {
      await fs.mkdir(targetDir, { recursive: true });

      await Promise.all([
        this.saveAsGzip(sanitizedHtml, join(targetDir, `${baseFileName}${this.HTML_FILE_SUFFIX}`)),
        this.saveAsGzip(nodes, join(targetDir, `${baseFileName}${this.NODES_FILE_SUFFIX}`)),
        fs.writeFile(join(targetDir, `${baseFileName}${this.HASH_FILE_SUFFIX}`), nodesHash, 'utf8'),
        fs.writeFile(join(targetDir, `${baseFileName}${this.HMTL_FILE_HASH_SUFFIX}`), htmlHash, 'utf8'),
      ]);

     
    } catch (error) {
      this.deleteEvaluation(evalIdentifier);
      throw error;
    }
  }

  async saveAsGzip(data: any, filePath: string): Promise<void> {
    const compressedPath = `${filePath}.gz`;
    
    const sourceStream = Readable.from([JSON.stringify(data)]);
    
    const gzipStream = createGzip();
    
    const destinationStream = createWriteStream(compressedPath);

    try {
      await pipeline(sourceStream, gzipStream, destinationStream);
      this.logger.log(`File saved ${compressedPath} successfully.`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Failed to compress/write file for evaluation:', error.message);
      throw error;
    }
  }

  public async getEvaluationNodesPath(evaluationIdentifier: EvaluationIdentifier): Promise<string> {
  const { targetDir, baseFileName } = this.buildSafePaths(evaluationIdentifier);
  const nodesFileName = `${baseFileName}_nodes.json.gz`;
  const fullPath = join(targetDir, nodesFileName);

  try {
    await fs.access(fullPath, fs.constants.R_OK);
    return fullPath;
  } catch (error) {
    throw new NotFoundException(`File not found for Website ID: ${evaluationIdentifier.websiteId}, Page ID: ${evaluationIdentifier.pageId}, Date: ${evaluationIdentifier.evaluationDate}`);
  }
}
  public async getEvaluationHtmlPath(evaluationIdentifier: EvaluationIdentifier): Promise<string> {
  const { targetDir, baseFileName } = this.buildSafePaths(evaluationIdentifier);
  const htmlFileName = `${baseFileName}.html.gz`;
  const fullPath = join(targetDir, htmlFileName);

    try {
      await fs.access(fullPath, fs.constants.R_OK);
      return fullPath;
    } catch  {
      throw new NotFoundException(`File not found for Evaluation ID: ${evaluationIdentifier.evaluationId}`);
    }
  }

  cleanHtml(html: string): string {
    if (!html) return '';
    const $ = cheerio.load(html);
    $('head script, head style').remove();
    return $.html();
  }

  async deleteEvaluation(evaluationIdentifier: EvaluationIdentifier): Promise<void> {
    const { targetDir, baseFileName } = this.buildSafePaths(evaluationIdentifier);
    const htmlFileName = `${baseFileName}${this.HTML_FILE_SUFFIX}`;
    const nodesFileName = `${baseFileName}${this.NODES_FILE_SUFFIX}`;
    const hashFileName = `${baseFileName}${this.HASH_FILE_SUFFIX}`;
    const htmlHashFileName = `${baseFileName}.${this.HMTL_FILE_HASH_SUFFIX}`;

    const htmlPath = join(targetDir, htmlFileName);
    const nodesPath = join(targetDir, nodesFileName);
    const hashPath = join(targetDir, hashFileName);
    const htmlHashPath = join(targetDir, htmlHashFileName);

    try {
      await Promise.all([
        fs.unlink(htmlPath),
        fs.unlink(nodesPath),
        fs.unlink(hashPath),
        fs.unlink(htmlHashPath)
      ]);

      this.logger.log(`Evaluation deleted successfully for Website ID: ${evaluationIdentifier.websiteId}, Page ID: ${evaluationIdentifier.pageId}, Date: ${evaluationIdentifier.evaluationDate}`);
    } catch {
      throw new NotFoundException(`Error deleting evaluation files for Evaluation ID: ${evaluationIdentifier.evaluationId}`);
    }
  }
}