import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  HeadObjectCommand, 
  DeleteObjectsCommand 
} from '@aws-sdk/client-s3';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { ReadStream } from 'node:fs';
import { EvaluationIdentifier, EvaluationFileType } from '../../types';
import {
  EvaluationStorage,
  EvaluationStoragePayload,
} from 'src/domains/audit-engine/evaluation/contracts/evaluation-storage.contract';
import { computeHash } from 'src/common/utils/crypto';

const asyncGzip = promisify(gzip);

interface EvaluationFileKeys {
  htmlKey: string;
  nodesKey: string;
  hashKey: string;
  htmlHashKey: string;
}

@Injectable()
export class EvaluationS3StorageStrategy implements EvaluationStorage {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly s3Prefix = 'evaluations/';

  private readonly HTML_FILE_COMPRESSED_SUFFIX = '.html.gz';
  private readonly NODES_FILE_COMPRESSED_SUFFIX = '_nodes.json.gz';
  private readonly HTML_FILE_HASH_SUFFIX = '.html.sha256';
  private readonly HASH_FILE_SUFFIX = '_nodes.json.sha256'; 
  constructor(private readonly logger: Logger) {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';
    if (!this.bucketName) {
      this.logger.warn('AWS_S3_BUCKET_NAME is not defined in environment variables.');
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-1',

    });
  }

  private buildSafeKeys(evalIdentifier: EvaluationIdentifier): { prefixDir: string; baseFileName: string } {
    const safeDate = new Date(evalIdentifier.evaluationDate).toISOString().slice(0, 10);
    const prefixDir = `${this.s3Prefix}${safeDate}/${evalIdentifier.websiteId}`;
    const baseFileName = `${evalIdentifier.pageId}_${evalIdentifier.evaluationId}`;

    return { prefixDir, baseFileName };
  }

  private buildFileKeys(prefixDir: string, baseFileName: string): EvaluationFileKeys {
    return {
      htmlKey: `${prefixDir}/${baseFileName}${this.HTML_FILE_COMPRESSED_SUFFIX}`,
      nodesKey: `${prefixDir}/${baseFileName}${this.NODES_FILE_COMPRESSED_SUFFIX}`,
      hashKey: `${prefixDir}/${baseFileName}${this.HASH_FILE_SUFFIX}`,
      htmlHashKey: `${prefixDir}/${baseFileName}${this.HTML_FILE_HASH_SUFFIX}`,
    };
  }

  private getFileKeyForType(
    prefixDir: string,
    baseFileName: string,
    fileType: EvaluationFileType,
  ): string {
    const fileName =
      fileType === 'html'
        ? `${baseFileName}${this.HTML_FILE_COMPRESSED_SUFFIX}`
        : `${baseFileName}${this.NODES_FILE_COMPRESSED_SUFFIX}`;
    return `${prefixDir}/${fileName}`;
  }

  private validateFileType(fileType: EvaluationFileType): void {
    if (fileType !== 'html' && fileType !== 'nodes') {
      throw new NotFoundException(
        `Invalid file type requested: ${fileType}. Must be 'html' or 'nodes'.`,
      );
    }
  }

  private generateFileHash(data: string, evalIdentifier: EvaluationIdentifier): string {
    return computeHash(
      data + evalIdentifier.evaluationDate + evalIdentifier.websiteId + evalIdentifier.pageId,
    );
  }

  
  private async safeDeleteKey(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: { Objects: [{ Key: key }] },
        }),
      );
    } catch (error: unknown) {
      this.logger.warn(`Failed to safely delete S3 key: ${key}`, error);
    }
  }

  async save(payload: EvaluationStoragePayload): Promise<void> {
    const { prefixDir, baseFileName } = this.buildSafeKeys(payload.evalIdentifier);
    const { htmlKey, nodesKey, hashKey, htmlHashKey } = this.buildFileKeys(
      prefixDir,
      baseFileName,
    );

    const htmlHash = this.generateFileHash(payload.htmlContent, payload.evalIdentifier);
    const nodesHash = this.generateFileHash(JSON.stringify(payload.nodes), payload.evalIdentifier);

    try {
      // Comprime em memória antes de enviar para o S3
      const [htmlGzipped, nodesGzipped] = await Promise.all([
        asyncGzip(Buffer.from(payload.htmlContent, 'utf8')),
        asyncGzip(Buffer.from(JSON.stringify(payload.nodes), 'utf8')),
      ]);

      await Promise.all([
        this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: htmlKey,
            Body: htmlGzipped,
            ContentType: 'text/html',
            ContentEncoding: 'gzip',
          }),
        ),
        this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: nodesKey,
            Body: nodesGzipped,
            ContentType: 'application/json',
            ContentEncoding: 'gzip',
          }),
        ),
        this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: hashKey,
            Body: nodesHash,
            ContentType: 'text/plain',
          }),
        ),
        this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: htmlHashKey,
            Body: htmlHash,
            ContentType: 'text/plain',
          }),
        ),
      ]);
    } catch (error) {
      await Promise.all([
        this.safeDeleteKey(htmlKey),
        this.safeDeleteKey(nodesKey),
        this.safeDeleteKey(hashKey),
        this.safeDeleteKey(htmlHashKey),
      ]);

      this.logger.error(
        `Failed to save evaluation files to S3 for ID: ${payload.evalIdentifier.evaluationId}`,
        error,
      );
      throw error;
    }
  }

  public async getStream(
    evaluationIdentifier: EvaluationIdentifier,
    fileType: EvaluationFileType,
  ): Promise<ReadStream> {
    const { prefixDir, baseFileName } = this.buildSafeKeys(evaluationIdentifier);
    this.validateFileType(fileType);
    const fullKey = this.getFileKeyForType(prefixDir, baseFileName, fileType);

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: fullKey,
        }),
      );

      if (!response.Body) {
        throw new NotFoundException(
          `File body is empty for Evaluation ID: ${evaluationIdentifier.evaluationId}`,
        );
      }

      return response.Body as unknown as ReadStream;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        throw new NotFoundException(
          `File not found in S3 for Evaluation ID: ${evaluationIdentifier.evaluationId}`,
        );
      }
      throw error;
    }
  }

  public async exists(evaluationIdentifier: EvaluationIdentifier): Promise<boolean> {
    const { prefixDir, baseFileName } = this.buildSafeKeys(evaluationIdentifier);
    const { htmlKey, nodesKey } = this.buildFileKeys(prefixDir, baseFileName);

    try {
      await Promise.all([
        this.s3Client.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: htmlKey })),
        this.s3Client.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: nodesKey })),
      ]);
      return true;
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.name === 'NoSuchKey' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  async delete(evaluationIdentifier: EvaluationIdentifier): Promise<void> {
    const { prefixDir, baseFileName } = this.buildSafeKeys(evaluationIdentifier);
    const { htmlKey, nodesKey, hashKey, htmlHashKey } = this.buildFileKeys(
      prefixDir,
      baseFileName,
    );

    try {
      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: {
            Objects: [
              { Key: htmlKey },
              { Key: nodesKey },
              { Key: hashKey },
              { Key: htmlHashKey },
            ],
            Quiet: true,
          },
        }),
      );

      this.logger.log(
        `Evaluation files successfully deleted from S3 for ID: ${evaluationIdentifier.evaluationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Unexpected error deleting evaluation files from S3 for ID: ${evaluationIdentifier.evaluationId}`,
        error,
      );
      throw error;
    }
  }
}