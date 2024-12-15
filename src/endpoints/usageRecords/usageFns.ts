import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {
  UsageRecordDecrementInput,
  UsageRecordIncrementInput,
} from '../../contexts/usage/types.js';
import {File} from '../../definitions/file.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {
  BandwidthUsageRecordArtifact,
  FileUsageRecordArtifact,
  kUsageRecordArtifactType,
  kUsageRecordCategory,
} from '../../definitions/usageRecord.js';
import {getActionAgentFromSessionAgent} from '../../utils/sessionUtils.js';
import RequestData from '../RequestData.js';
import {UsageLimitExceededError} from './errors.js';

// #region "increment fns"
async function incrementUsageRecord(
  reqData: RequestData,
  input: UsageRecordIncrementInput,
  nothrow = false
) {
  const agent = getActionAgentFromSessionAgent(
    await kUtilsInjectables
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      )
  );

  const result = await kUtilsInjectables.usage().increment(agent, input);

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
    await kUtilsInjectables
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      )
  );

  await kUtilsInjectables.usage().decrement(agent, input);
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
