export const QUEUE_NAMES = {
  CRAWL_PRIVATE: "crawl-queue-private",
  CRAWL_PUBLIC: "crawl-queue-public",
  EVAL_PUBLIC: "evaluation-queue-public",
  EVAL_PRIVATE: "evaluation-queue-private",
};

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
