export function useBatchWriterStats() {
  return {
    status: 'idle',
    costSavingsPercentage: 0,
    pendingQueueSize: 0,
    totalNetworkRequestsSaved: 0,
    totalBatchesCommitted: 0,
    totalWritesQueued: 0,
    lastBatchDurationMs: 0,
    lastBatchSize: 0,
    lastFlushTimestamp: 0,
    triggerFlush: async () => {},
  };
}

export const BatchWriterService = {
  getQueue: () => [],
  flush: async () => {},
  enqueueQuotesMap: (quotes: Record<string, any>) => {},
};
