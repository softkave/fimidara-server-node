import {File} from '../../definitions/file.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {
  BandwidthUsageRecordArtifact,
  FileUsageRecordArtifact,
  kUsageRecordArtifactType,
  kUsageRecordCategory,
} from '../../definitions/usageRecord.js';
import RequestData from '../../endpoints/RequestData.js';
import {UsageLimitExceededError} from '../../endpoints/usageRecords/errors.js';
import {getActionAgentFromSessionAgent} from '../../utils/sessionUtils.js';
import {kSessionUtils} from '../SessionContext.js';
import {kIjxUtils} from '../ijx/injectables.js';
import {
  queueDecrementUsageRecord,
  queueIncrementUsageRecord,
} from './queueUsageOps.js';
import {UsageRecordDecrementInput, UsageRecordIncrementInput} from './types.js';

// #region "increment fns"
async function incrementUsageRecord(
  reqData: RequestData,
  input: UsageRecordIncrementInput,
  nothrow = false
) {
  // const markPrefix = `incrementUsageRecord-${input.category}-${input.workspaceId}`;
  // performance.mark(`${markPrefix}-getAgent`);
  const agent = getActionAgentFromSessionAgent(
    await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      )
  );
  // const getAgentMeasure = performance.measure(
  //   `${markPrefix}-getAgent`,
  //   `${markPrefix}-getAgent`
  // );
  // console.log(`${markPrefix}-getAgent: ${getAgentMeasure.duration}ms`);

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

export async function incrementStorageUsageRecord(
  reqData: RequestData,
  file: Pick<File, 'namepath' | 'workspaceId' | 'size'> &
    Partial<Pick<File, 'resourceId'>>,
  action: FimidaraPermissionAction,
  artifactMetaInput: Partial<FileUsageRecordArtifact> = {},
  nothrow = false
) {
  const artifactMeta: FileUsageRecordArtifact = {
    requestId: reqData.requestId,
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

  await incrementUsageRecord(reqData, input, nothrow);
}

export async function incrementStorageEverConsumedUsageRecord(
  reqData: RequestData,
  file: Pick<File, 'namepath' | 'workspaceId' | 'size'> &
    Partial<Pick<File, 'resourceId'>>,
  action: FimidaraPermissionAction,
  artifactMetaInput: Partial<FileUsageRecordArtifact> = {},
  nothrow = false
) {
  const artifactMeta: FileUsageRecordArtifact = {
    requestId: reqData.requestId,
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

  await incrementUsageRecord(reqData, input, nothrow);
}

export async function incrementBandwidthInUsageRecord(
  reqData: RequestData,
  file: Pick<File, 'namepath' | 'workspaceId' | 'size'> &
    Partial<Pick<File, 'resourceId'>>,
  action: FimidaraPermissionAction,
  nothrow = false
) {
  const artifactMeta: BandwidthUsageRecordArtifact = {
    filepath: file.namepath,
    requestId: reqData.requestId,
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

  await incrementUsageRecord(reqData, input, nothrow);
}

export async function incrementBandwidthOutUsageRecord(
  reqData: RequestData,
  file: Pick<File, 'namepath' | 'workspaceId' | 'size'> &
    Partial<Pick<File, 'resourceId'>>,
  action: FimidaraPermissionAction,
  nothrow = false
) {
  const artifactMeta: BandwidthUsageRecordArtifact = {
    requestId: reqData.requestId,
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

  await incrementUsageRecord(reqData, input, nothrow);
}
// #endregion "increment fns"

// #region "decrement fns"
async function decrementUsageRecord(
  reqData: RequestData,
  input: UsageRecordDecrementInput
) {
  const agent = getActionAgentFromSessionAgent(
    await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      )
  );

  await queueDecrementUsageRecord({agent, input});
}

export async function decrementStorageUsageRecord(
  reqData: RequestData,
  file: Pick<File, 'size' | 'workspaceId'>
) {
  const input: UsageRecordDecrementInput = {
    category: kUsageRecordCategory.storage,
    workspaceId: file.workspaceId,
    usage: file.size,
  };

  await decrementUsageRecord(reqData, input);
}
// #endregion "decrement fns"
