import assert from 'assert';
import {kUtilsInjectables} from '../injection/injectables.js';

export const kUsageProviderConstants = {
  defaultWorkspaceRefreshIntervalMs: 1000 * 60 * 60 * 24, // 1 day
  defaultBatchedUsageCommitIntervalMs: 1000 * 60 * 10, // 10 minutes
  defaultUsageL1BatchedUpdatesSize: 100,
  defaultUsageL2BatchedUpdatesSize: 100,
  addUsageRecordQueueTimeout: 30_000,
  addUsageRecordProcessCount: 100,
  getAddUsageRecordPubSubChannel: (workspaceId: string) =>
    `${
      kUtilsInjectables.suppliedConfig().addUsageRecordPubSubChannelPrefix
    }-${workspaceId}`,
  getAddUsageRecordQueueWithNo: (num: number) =>
    `${kUtilsInjectables.suppliedConfig().addUsageRecordQueuePrefix}${num}`,
  getAddUsageRecordQueueKey: (workspaceId: string) => {
    const {addUsageRecordQueueStart, addUsageRecordQueueEnd} =
      kUtilsInjectables.suppliedConfig();

    assert.ok(addUsageRecordQueueStart);
    assert.ok(addUsageRecordQueueEnd);

    const queueCount = addUsageRecordQueueEnd - addUsageRecordQueueStart + 1;
    assert.ok(queueCount > 0);

    const hash = workspaceId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    const key = kUsageProviderConstants.getAddUsageRecordQueueWithNo(
      (hash % queueCount) + addUsageRecordQueueStart
    );

    return key;
  },
};
