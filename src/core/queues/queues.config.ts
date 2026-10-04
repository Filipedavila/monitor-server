export const QUEUE_NAMES = {
  CRAWL_PRIVATE: 'crawl-queue-private',
  CRAWL_PRIVATE_DLQ: 'crawl-queue-private-dlq',
  CRAWL_PUBLIC: 'crawl-queue-public',
  CRAWL_PUBLIC_DLQ: 'crawl-queue-public-dlq',
  WEBSITE_EXTRACTION: 'website-extraction',
  PUBLIC_PAGE_DISPATCH: 'public-page-dispatch',
  PRIVATE_PAGE_DISPATCH: 'private-page-dispatch',
  EVAL_PUBLIC: 'evaluation-queue-public',
  EVAL_PUBLIC_DLQ: 'evaluation-queue-public-dlq',
  EVAL_PRIVATE: 'evaluation-queue-private',
  EVAL_PRIVATE_DLQ: 'evaluation-queue-private-dlq',
  AUTHORIZATION: 'authorization-queue',
};

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
