import {File} from '../../definitions/file.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {Agent, kFimidaraResourceType} from '../../definitions/system.js';
import {
  BandwidthUsageRecordArtifact,
  FileUsageRecordArtifact,
  kUsageRecordArtifactType,
  kUsageRecordCategory,
} from '../../definitions/usageRecord.js';
import {UsageLimitExceededError} from '../../endpoints/usageRecords/errors.js';
import {
  queueDecrementUsageRecord,
  queueIncrementUsageRecord,
} from './queueUsageOps.js';
import {UsageRecordDecrementInput, UsageRecordIncrementInput} from './types.js';

// #region "increment fns"
async function incrementUsageRecord(params: {
  agent: Agent;
  input: UsageRecordIncrementInput;
  nothrow?: boolean;
}) {
  const {agent, input, nothrow = false} = params;
  // const markPrefix = `incrementUsageRecord-${input.category}-${input.workspaceId}`;
  // performance.mark(`${markPrefix}-queue`);
  const result = await queueIncrementUsageRecord({agent, input});
  // performance.mark(`${markPrefix}-end`);
  // const queueMeasure = performance.measure(
  //   `${markPrefix}-queue`,
  //   `${markPrefix}-queue`
  // );
  // console.log(`${markPrefix}-queue: ${queueMeasure.duration}ms`);

  if (!result.permitted && !nothrow) {
    throw new UsageLimitExceededError({
      reqCategory: input.category,
      blockingCategory: result.category || input.category,
    });
  }

  return result.permitted;
}

export async function incrementStorageUsageRecord(params: {
  requestId: string;
  agent: Agent;
  file: Pick<File, 'namepath' | 'workspaceId' | 'size'> &
    Partial<Pick<File, 'resourceId'>>;
  action: FimidaraPermissionAction;
  artifactMetaInput?: Partial<FileUsageRecordArtifact>;
  nothrow?: boolean;
}) {
  const {
    requestId,
    agent,
    file,
    action,
    artifactMetaInput,
    nothrow = false,
  } = params;

  const artifactMeta: FileUsageRecordArtifact = {
    requestId,
    filepath: file.namepath,
    fileId: file.resourceId,
    ...artifactMetaInput,
  };

  const input: UsageRecordIncrementInput = {
    category: kUsageRecordCategory.storage,
    workspaceId: file.workspaceId,
    usage: file.size,
    artifacts: [
      {
        resourceType: kFimidaraResourceType.File,
        type: kUsageRecordArtifactType.file,
        artifact: artifactMeta,
        action,
      },
    ],
  };

  await incrementUsageRecord({agent, input, nothrow});
}

export async function incrementStorageEverConsumedUsageRecord(params: {
  requestId: string;
  agent: Agent;
  file: Pick<File, 'namepath' | 'workspaceId' | 'size'> &
    Partial<Pick<File, 'resourceId'>>;
  action: FimidaraPermissionAction;
  artifactMetaInput?: Partial<FileUsageRecordArtifact>;
  nothrow?: boolean;
}) {
  const {
    requestId,
    agent,
    file,
    action,
    artifactMetaInput,
    nothrow = false,
  } = params;

  const artifactMeta: FileUsageRecordArtifact = {
    requestId,
    filepath: file.namepath,
    fileId: file.resourceId,
    ...artifactMetaInput,
  };

  const input: UsageRecordIncrementInput = {
    category: kUsageRecordCategory.storageEverConsumed,
    workspaceId: file.workspaceId,
    usage: file.size,
    artifacts: [
      {
        resourceType: kFimidaraResourceType.File,
        type: kUsageRecordArtifactType.file,
        artifact: artifactMeta,
        action,
      },
    ],
  };

  await incrementUsageRecord({agent, input, nothrow});
}

export async function incrementBandwidthInUsageRecord(params: {
  requestId: string;
  agent: Agent;
  file: Pick<File, 'namepath' | 'workspaceId' | 'size'> &
    Partial<Pick<File, 'resourceId'>>;
  action: FimidaraPermissionAction;
  nothrow?: boolean;
}) {
  const {requestId, agent, file, action, nothrow = false} = params;
  const artifactMeta: BandwidthUsageRecordArtifact = {
    filepath: file.namepath,
    requestId,
    fileId: file.resourceId,
  };

  const input: UsageRecordIncrementInput = {
    category: kUsageRecordCategory.bandwidthIn,
    workspaceId: file.workspaceId,
    usage: file.size,
    artifacts: [
      {
        resourceType: kFimidaraResourceType.File,
        type: kUsageRecordArtifactType.file,
        artifact: artifactMeta,
        action,
      },
    ],
  };

  await incrementUsageRecord({agent, input, nothrow});
}

export async function incrementBandwidthOutUsageRecord(params: {
  requestId: string;
  agent: Agent;
  file: Pick<File, 'namepath' | 'workspaceId' | 'size'> &
    Partial<Pick<File, 'resourceId'>>;
  action: FimidaraPermissionAction;
  nothrow?: boolean;
}) {
  const {requestId, agent, file, action, nothrow = false} = params;
  const artifactMeta: BandwidthUsageRecordArtifact = {
    requestId,
    filepath: file.namepath,
    fileId: file.resourceId,
  };

  const input: UsageRecordIncrementInput = {
    workspaceId: file.workspaceId,
    category: kUsageRecordCategory.bandwidthOut,
    usage: file.size,
    artifacts: [
      {
        action,
        artifact: artifactMeta,
        type: kUsageRecordArtifactType.file,
        resourceType: kFimidaraResourceType.File,
      },
    ],
  };

  await incrementUsageRecord({agent, input, nothrow});
}
// #endregion "increment fns"

// #region "decrement fns"
async function decrementUsageRecord(params: {
  agent: Agent;
  input: UsageRecordDecrementInput;
}) {
  const {agent, input} = params;
  await queueDecrementUsageRecord({agent, input});
}

export async function decrementStorageUsageRecord(params: {
  agent: Agent;
  file: Pick<File, 'size' | 'workspaceId'>;
}) {
  const {agent, file} = params;
  const input: UsageRecordDecrementInput = {
    category: kUsageRecordCategory.storage,
    workspaceId: file.workspaceId,
    usage: file.size,
  };

  await decrementUsageRecord({agent, input});
}
// #endregion "decrement fns"
