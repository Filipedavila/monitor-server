import { Readable } from 'stream';

export interface ResourceQuerySet {
  summary: string;
  plotScore: string;
  scoreDistribution: string;
  scoreMetrics: string;
  metrics: string;
  rulesLatestQuartiles: string;
}


export interface FileStreamResult {
  stream: Readable;
  contentType: string;
  filename: string;
}
export type ResourceTarget = 'directory' | 'tag' | 'website' | 'global';

export type ContextTarget = 'ams' | 'observatory';

