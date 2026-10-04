  import * as crypto from 'node:crypto';

  export function computeHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }