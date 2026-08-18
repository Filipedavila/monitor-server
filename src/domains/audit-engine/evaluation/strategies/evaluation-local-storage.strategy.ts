import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { join, normalize } from 'node:path';
import { createReadStream,  ReadStream } from 'node:fs';
import { EvaluationIdentifier,  SafePaths, EvaluationFileType } from '../types';
import { EvaluationStorage, EvaluationStoragePayload } from '../types/evaluation-storage.interface';
import { saveAsGzip } from 'src/common/utils/utils';
import { cleanHtml } from '../html-sanitizer';
import { computeHash } from 'src/common/utils/crypto';

@Injectable()
export class EvaluationLocalStorageStrategy implements EvaluationStorage, OnModuleInit {

 private readonly BASE_PATH = normalize(join(process.cwd(), 'storage/evaluations'));
  private readonly HTML_FILE_SUFFIX = '.html';
  private readonly HTML_FILE_HASH_SUFFIX = '.html.sha256';
  private readonly NODES_FILE_SUFFIX = '_nodes.json';
  private readonly HASH_FILE_SUFFIX = '_nodes.json.sha256';
  private readonly HTML_FILE_COMPRESSED_SUFFIX = '.html.gz';
  private readonly NODES_FILE_COMPRESSED_SUFFIX = '_nodes.json.gz';

  constructor(private readonly logger: Logger) {

  }

  async onModuleInit() {
  await fs.mkdir(this.BASE_PATH, { recursive: true });
}
  private buildSafePaths(evalIdentifier: EvaluationIdentifier): SafePaths {
     const safeDate = new Date(evalIdentifier.evaluationDate).toISOString().slice(0, 10);
    const targetDir = join(this.BASE_PATH, safeDate, `${evalIdentifier.websiteId}`);
    const baseFileName = `${evalIdentifier.pageId}_${evalIdentifier.evaluationId}`;
   
    return { targetDir, baseFileName };
  }

  private buildFilePaths(targetDir: string, baseFileName: string) {
    return {
      htmlPath: join(targetDir, `${baseFileName}${this.HTML_FILE_SUFFIX}`),
      nodesPath: join(targetDir, `${baseFileName}${this.NODES_FILE_SUFFIX}`),
      hashPath: join(targetDir, `${baseFileName}${this.HASH_FILE_SUFFIX}`),
      htmlHashPath: join(targetDir, `${baseFileName}${this.HTML_FILE_HASH_SUFFIX}`),
    };
  }

  private getFilePathForType(targetDir: string, baseFileName: string, fileType: EvaluationFileType): string {
    const fileName =
      fileType === 'html'
        ? `${baseFileName}${this.HTML_FILE_COMPRESSED_SUFFIX}`
        : `${baseFileName}${this.NODES_FILE_COMPRESSED_SUFFIX}`;
    return join(targetDir, fileName);
  }

  private validateFileType(fileType: EvaluationFileType): void {
    if (fileType !== 'html' && fileType !== 'nodes') {
      throw new NotFoundException(`Invalid file type requested: ${fileType}. Must be 'html' or 'nodes'.`);
    }
  }

  private generateFileHash(data: string, evalIdentifier: EvaluationIdentifier,): string {
    return computeHash(data + evalIdentifier.evaluationDate + evalIdentifier.websiteId + evalIdentifier.pageId);
  }


  async save(payload:EvaluationStoragePayload
  ): Promise<void> {
    const { targetDir, baseFileName } = this.buildSafePaths(payload.evalIdentifier);
    const { htmlPath, nodesPath, hashPath, htmlHashPath } = this.buildFilePaths(targetDir, baseFileName);
    const htmlHash = this.generateFileHash(payload.htmlContent, payload.evalIdentifier);
    const nodesHash = this.generateFileHash(JSON.stringify(payload.nodes), payload.evalIdentifier);

    try {
      await fs.mkdir(targetDir, { recursive: true });

      await Promise.all([
        saveAsGzip(payload.htmlContent, htmlPath),
        saveAsGzip(payload.nodes, nodesPath),
        fs.writeFile(hashPath, nodesHash, 'utf8'),
        fs.writeFile(htmlHashPath, htmlHash, 'utf8'),
      ]);

     
    } catch (error) {
      await Promise.all([
        fs.unlink(htmlPath).catch(() => {}),
        fs.unlink(nodesPath).catch(() => {}),
        fs.unlink(hashPath).catch(() => {}),
        fs.unlink(htmlHashPath).catch(() => {}),
      ]);
      this.logger.error(`Failed to save evaluation files for ID: ${payload.evalIdentifier.evaluationId}`, error);
      throw error;
    }
  }

  public async getStream(
    evaluationIdentifier: EvaluationIdentifier,
    fileType: EvaluationFileType,
  ): Promise<ReadStream> {
    const { targetDir, baseFileName } = this.buildSafePaths(evaluationIdentifier);
    this.validateFileType(fileType);
    const fullPath = this.getFilePathForType(targetDir, baseFileName, fileType);

    try {
        await fs.access(fullPath, fs.constants.R_OK);
    } catch {
        throw new NotFoundException(`File not found for Evaluation ID: ${evaluationIdentifier.evaluationId}`);
    }
    return createReadStream(fullPath);
  }

  public async exists(
    evaluationIdentifier: EvaluationIdentifier ): Promise<boolean> {
    const { targetDir, baseFileName } = this.buildSafePaths(evaluationIdentifier);
    const htmlFileName = `${baseFileName}${this.HTML_FILE_SUFFIX}`;
    const nodesFileName = `${baseFileName}${this.NODES_FILE_SUFFIX}`;
    
    const fullPathHtml = join(targetDir, htmlFileName);
    const fullPathNodes = join(targetDir, nodesFileName);

      try {
      await fs.access(fullPathHtml, fs.constants.F_OK);
      await fs.access(fullPathNodes, fs.constants.F_OK);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  

  async delete(evaluationIdentifier: EvaluationIdentifier): Promise<void> {

    const { targetDir, baseFileName } = this.buildSafePaths(evaluationIdentifier);
    const { htmlPath, nodesPath, hashPath, htmlHashPath } = this.buildFilePaths(targetDir, baseFileName); 

    try {
      await Promise.all([
        fs.unlink(htmlPath),
        fs.unlink(nodesPath),
        fs.unlink(hashPath),
        fs.unlink(htmlHashPath)
      ]);

      this.logger.log(`Evaluation deleted successfully for Evaluation ID: ${evaluationIdentifier.evaluationId}`);
    } catch {
      throw new NotFoundException(`Error deleting evaluation files for Evaluation ID: ${evaluationIdentifier.evaluationId}`);
    }
  }
}