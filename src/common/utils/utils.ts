import { rename, unlink } from 'fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

export function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
    array.slice(i * size, i * size + size),
  );
}

export async function saveAsGzip(data: unknown, filePath: string): Promise<void> {
  const compressedPath = `${filePath}.gz`;
  const tempPath = `${compressedPath}.${process.pid}.${Date.now()}.tmp`;

  const gzipStream = createGzip();

  const sourceStream = Readable.from([JSON.stringify(data)]);
  const destinationStream = createWriteStream(tempPath);

  try {
    await pipeline(sourceStream, gzipStream, destinationStream);

    await rename(tempPath, compressedPath);
  } catch (err) {
    try {
      await unlink(tempPath);
    } catch {
      /* empty */
    }
    const error = err instanceof Error ? err : new Error(String(err));
    throw error;
  }
}
