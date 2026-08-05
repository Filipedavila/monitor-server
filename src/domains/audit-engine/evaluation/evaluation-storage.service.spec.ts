import { NotFoundException } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { join, normalize } from 'node:path';
import { EvaluationStorageService } from './evaluation-storage.service';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { EvaluationIdentifier } from './types';

jest.mock('node:fs/promises');
jest.mock('node:fs', () => ({
  createWriteStream: jest.fn(),
}));
jest.mock('node:zlib', () => ({
  createGzip: jest.fn(),
}));
jest.mock('node:stream/promises', () => ({
  pipeline: jest.fn(),
}));

const mockAppLoggerService = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  setContext: jest.fn(),
};

const evalIdentifier: EvaluationIdentifier = {
  evaluationId: 42,
  websiteId: 'site-1',
  pageId: 'page-1',
  evaluationDate: '2026-08-04',
};

const BASE_PATH = normalize(join(process.cwd(), 'storage/evaluations'));

describe('EvaluationStorageService', () => {
  let service: EvaluationStorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    (createWriteStream as jest.Mock).mockReturnValue({});
    (createGzip as jest.Mock).mockReturnValue({});
    (pipeline as jest.Mock).mockResolvedValue(undefined);

    service = new EvaluationStorageService(mockAppLoggerService as unknown as AppLoggerService);
  });

  describe('constructor', () => {
    it('creates the base storage directory', () => {
      expect(fs.mkdir).toHaveBeenCalledWith(BASE_PATH, { recursive: true });
    });

    it('logs an error when the base directory cannot be created', async () => {
      const error = new Error('disk full');
      (fs.mkdir as jest.Mock).mockRejectedValueOnce(error);

      new EvaluationStorageService(mockAppLoggerService as unknown as AppLoggerService);
      // let the rejected promise's .catch handler run
      await Promise.resolve();
      await Promise.resolve();

      expect(mockAppLoggerService.error).toHaveBeenCalledWith(
        'Failed to create base storage directory:',
        error,
      );
    });
  });

  describe('cleanHtml', () => {
    it('returns an empty string for empty/falsy input', () => {
      expect(service.cleanHtml('')).toBe('');
    });

    it('strips scripts and styles from the head', () => {
      const html = '<html><head><script>evil()</script><style>.a{}</style><title>T</title></head><body><script>keepme()</script></body></html>';

      const result = service.cleanHtml(html);

      expect(result).not.toContain('evil()');
      expect(result).not.toContain('.a{}');
      expect(result).toContain('<title>T</title>');
      expect(result).toContain('keepme()');
    });
  });

  describe('saveAsGzip', () => {
    it('compresses and writes the data, then logs success', async () => {
      await service.saveAsGzip({ some: 'data' }, '/tmp/target/file.json');

      expect(createGzip).toHaveBeenCalled();
      expect(createWriteStream).toHaveBeenCalledWith('/tmp/target/file.json.gz');
      expect(pipeline).toHaveBeenCalled();
      expect(mockAppLoggerService.log).toHaveBeenCalledWith(
        'File saved /tmp/target/file.json.gz successfully.',
      );
    });

    it('logs and rethrows when the pipeline fails', async () => {
      const error = new Error('stream broke');
      (pipeline as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.saveAsGzip('data', '/tmp/target/file.json')).rejects.toThrow(error);
      expect(mockAppLoggerService.error).toHaveBeenCalledWith(
        'Failed to compress/write file for evaluation:',
        'stream broke',
      );
    });

    it('wraps non-Error rejections before logging', async () => {
      (pipeline as jest.Mock).mockRejectedValueOnce('plain string failure');

      await expect(service.saveAsGzip('data', '/tmp/target/file.json')).rejects.toThrow(
        'plain string failure',
      );
      expect(mockAppLoggerService.error).toHaveBeenCalledWith(
        'Failed to compress/write file for evaluation:',
        'plain string failure',
      );
    });
  });

  describe('saveEvaluation', () => {
    const targetDir = join(BASE_PATH, evalIdentifier.evaluationDate, evalIdentifier.websiteId);
    const baseFileName = `${evalIdentifier.pageId}_${evalIdentifier.evaluationId}`;

    it('sanitizes the html, creates the target directory and writes all four artifact files', async () => {
      const html = '<html><head><script>evil()</script></head><body>ok</body></html>';
      const nodes = { a: 1 };

      await service.saveEvaluation(evalIdentifier, html, nodes);

      expect(fs.mkdir).toHaveBeenCalledWith(targetDir, { recursive: true });
      expect(createWriteStream).toHaveBeenCalledWith(
        join(targetDir, `${baseFileName}.html.gz.gz`),
      );
      expect(createWriteStream).toHaveBeenCalledWith(
        join(targetDir, `${baseFileName}_nodes.json.gz.gz`),
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        join(targetDir, `${baseFileName}_nodes.json.sha256`),
        expect.any(String),
        'utf8',
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        join(targetDir, `${baseFileName}.html.sha256`),
        expect.any(String),
        'utf8',
      );
    });

    it('sanitizes unsafe characters out of websiteId and pageId when building paths', async () => {
      const unsafeIdentifier: EvaluationIdentifier = {
        ...evalIdentifier,
        websiteId: '../../etc',
        pageId: 'page/../1',
      };
      const safeDir = join(BASE_PATH, unsafeIdentifier.evaluationDate, 'etc');
      const safeBaseFileName = `page1_${unsafeIdentifier.evaluationId}`;

      await service.saveEvaluation(unsafeIdentifier, '<html></html>', {});

      expect(fs.mkdir).toHaveBeenCalledWith(safeDir, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        join(safeDir, `${safeBaseFileName}_nodes.json.sha256`),
        expect.any(String),
        'utf8',
      );
    });

    it('deletes partially written files and rethrows when directory creation fails', async () => {
      const error = new Error('mkdir failed');
      (fs.mkdir as jest.Mock).mockRejectedValueOnce(error);
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await expect(service.saveEvaluation(evalIdentifier, '<html></html>', {})).rejects.toThrow(
        error,
      );
      expect(fs.unlink).toHaveBeenCalledTimes(4);
    });

    it('deletes partially written files and rethrows when writing an artifact fails', async () => {
      const error = new Error('write failed');
      (fs.writeFile as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.saveEvaluation(evalIdentifier, '<html></html>', {})).rejects.toThrow(
        error,
      );
      expect(fs.unlink).toHaveBeenCalledTimes(4);
    });

    it('handles empty html content', async () => {
      await expect(service.saveEvaluation(evalIdentifier, '', {})).resolves.toBeUndefined();
    });
  });

  describe('getEvaluationNodesPath', () => {
    it('returns the full path when the nodes file is accessible', async () => {
      const { targetDir, baseFileName } = getExpectedPaths(evalIdentifier);
      const expectedPath = join(targetDir, `${baseFileName}_nodes.json.gz`);

      const result = await service.getEvaluationNodesPath(evalIdentifier);

      expect(result).toBe(expectedPath);
      expect(fs.access).toHaveBeenCalledWith(expectedPath, fs.constants.R_OK);
    });

    it('throws NotFoundException when the nodes file does not exist', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('ENOENT'));

      await expect(service.getEvaluationNodesPath(evalIdentifier)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getEvaluationHtmlPath', () => {
    it('returns the full path when the html file is accessible', async () => {
      const { targetDir, baseFileName } = getExpectedPaths(evalIdentifier);
      const expectedPath = join(targetDir, `${baseFileName}.html.gz`);

      const result = await service.getEvaluationHtmlPath(evalIdentifier);

      expect(result).toBe(expectedPath);
      expect(fs.access).toHaveBeenCalledWith(expectedPath, fs.constants.R_OK);
    });

    it('throws NotFoundException when the html file does not exist', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('ENOENT'));

      await expect(service.getEvaluationHtmlPath(evalIdentifier)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteEvaluation', () => {
    it('removes all four artifact files and logs success', async () => {
      await service.deleteEvaluation(evalIdentifier);

      expect(fs.unlink).toHaveBeenCalledTimes(4);
      expect(mockAppLoggerService.log).toHaveBeenCalledWith(
        expect.stringContaining('Evaluation deleted successfully'),
      );
    });

    it('throws NotFoundException when any file fails to delete', async () => {
      (fs.unlink as jest.Mock).mockRejectedValueOnce(new Error('ENOENT'));

      await expect(service.deleteEvaluation(evalIdentifier)).rejects.toThrow(NotFoundException);
    });
  });
});

function getExpectedPaths(evalIdentifier: EvaluationIdentifier) {
  const safeWebsiteId = evalIdentifier.websiteId.replace(/[^a-z0-9_-]/gi, '');
  const safePageId = evalIdentifier.pageId.replace(/[^a-z0-9_-]/gi, '');
  const targetDir = join(BASE_PATH, evalIdentifier.evaluationDate, safeWebsiteId);
  const baseFileName = `${safePageId}_${evalIdentifier.evaluationId}`;
  return { targetDir, baseFileName };
}
