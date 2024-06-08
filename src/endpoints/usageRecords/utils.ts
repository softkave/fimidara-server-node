import {File} from '../../definitions/file.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {
  BandwidthUsageRecordArtifact,
  FileUsageRecordArtifact,
  PublicUsageRecord,
  UsageRecord,
  UsageRecordArtifactTypeMap,
  UsageRecordCategory,
  UsageRecordCategoryMap,
} from '../../definitions/usageRecord.js';
import {Workspace} from '../../definitions/workspace.js';
import {appAssert} from '../../utils/assertion.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {kAppMessages} from '../../utils/messages.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {getActionAgentFromSessionAgent} from '../../utils/sessionUtils.js';
import {kUtilsInjectables} from '../contexts/injection/injectables.js';
import {UsageRecordInput} from '../contexts/logic/UsageRecordLogicProvider.js';
import {SemanticProviderMutationParams} from '../contexts/semantic/types.js';
import {kSessionUtils} from '../contexts/SessionContext.js';
import {NotFoundError} from '../errors.js';
import {workspaceResourceFields} from '../extractors.js';
import {stringifyFilenamepath} from '../files/utils.js';
import RequestData from '../RequestData.js';
import {UsageLimitExceededError} from './errors.js';

async function insertRecord(
  reqData: RequestData,
  input: UsageRecordInput,
  opts: SemanticProviderMutationParams,
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
  const {permitted} = await kUtilsInjectables.usageLogic().insert(agent, input, opts);

  if (!permitted && !nothrow) {
    throw new UsageLimitExceededError();
  }

  return permitted;
}

export async function insertStorageUsageRecordInput(
  reqData: RequestData,
  file: File,
  action: FimidaraPermissionAction,
  artifactMetaInput: Partial<FileUsageRecordArtifact> = {},
  opts: SemanticProviderMutationParams,
  nothrow = false
) {
  const artifactMeta: FileUsageRecordArtifact = {
    fileId: file.resourceId,
    filepath: stringifyFilenamepath(file),
    requestId: reqData.requestId,
    ...artifactMetaInput,
  };

  const input: UsageRecordInput = {
    workspaceId: file.workspaceId,
    category: UsageRecordCategoryMap.Storage,
    usage: file.size,
    artifacts: [
      {
        action,
        artifact: artifactMeta,
        type: UsageRecordArtifactTypeMap.File,
        resourceType: kFimidaraResourceType.File,
      },
    ],
  };

  await insertRecord(reqData, input, opts, nothrow);
}

export async function insertBandwidthInUsageRecordInput(
  reqData: RequestData,
  file: File,
  action: FimidaraPermissionAction,
  opts: SemanticProviderMutationParams,
  nothrow = false
) {
  const artifactMeta: BandwidthUsageRecordArtifact = {
    fileId: file.resourceId,
    filepath: stringifyFilenamepath(file),
    requestId: reqData.requestId,
  };

  const input: UsageRecordInput = {
    workspaceId: file.workspaceId,
    category: UsageRecordCategoryMap.BandwidthIn,
    usage: file.size,
    artifacts: [
      {
        action,
        artifact: artifactMeta,
        type: UsageRecordArtifactTypeMap.File,
        resourceType: kFimidaraResourceType.File,
      },
    ],
  };

  await insertRecord(reqData, input, opts, nothrow);
}

export async function insertBandwidthOutUsageRecordInput(
  reqData: RequestData,
  file: File,
  action: FimidaraPermissionAction,
  opts: SemanticProviderMutationParams,
  nothrow = false
) {
  const artifactMeta: BandwidthUsageRecordArtifact = {
    fileId: file.resourceId,
    filepath: stringifyFilenamepath(file),
    requestId: reqData.requestId,
  };

  const input: UsageRecordInput = {
    workspaceId: file.workspaceId,
    category: UsageRecordCategoryMap.BandwidthOut,
    usage: file.size,
    artifacts: [
      {
        action,
        artifact: artifactMeta,
        type: UsageRecordArtifactTypeMap.File,
        resourceType: kFimidaraResourceType.File,
      },
    ],
  };

  await insertRecord(reqData, input, opts, nothrow);
}

// export async function insertDbObjectUsageRecordInput(
//   ctx: Base
//   reqData: RequestData,
//   workspaceId: string,
//   resourceId: string,
//   action: BasicCRUDActions,
//   resourceType: FimidaraResourceType,
//   nothrow: boolean = false
// ) {
//   const artifactMeta: DatabaseObjectUsageRecordArtifact = {
//     resourceId,
//     requestId: reqData.requestId,
//   };

//   const input: UsageRecordInput = {
//     workspaceId,
//     category: UsageRecordCategoryMap.DatabaseObject,
//     usage: 1,
//     artifacts: [
//       {
//         action,
//         resourceType,
//         artifact: artifactMeta,
//         type: UsageRecordArtifactTypeMap.DatabaseObject,
//       },
//     ],
//   };

//   await insertRecord( reqData, input, nothrow);
// }

export function getRecordingPeriod() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  return {month: m, year: y};
}

export function getUsageThreshold(w: Workspace, category: UsageRecordCategory) {
  const thresholds = w.usageThresholds ?? {};
  return thresholds[category];
}

export function workspaceHasUsageThresholds(w: Workspace) {
  const thresholds = w.usageThresholds ?? {};
  return Object.values(UsageRecordCategoryMap).some(k => {
    const usage = thresholds[k];
    return usage && usage.budget > 0;
  });
}

export function sumWorkspaceThresholds(w: Workspace, exclude?: UsageRecordCategory[]) {
  const threshold = w.usageThresholds ?? {};
  return Object.values(UsageRecordCategoryMap).reduce((acc, k) => {
    if (exclude && exclude.includes(k)) {
      return acc;
    }

    const usage = threshold[k];
    return usage ? acc + usage.budget : acc;
  }, 0);
}

export function throwUsageRecordNotFound() {
  throw new NotFoundError(kAppMessages.usageRecord.notFound());
}

export function assertUsageRecord(item?: UsageRecord | null): asserts item {
  appAssert(item, kReuseableErrors.usageRecord.notFound());
}

const usageRecordFields = getFields<PublicUsageRecord>({
  ...workspaceResourceFields,
  category: true,
  fulfillmentStatus: true,
  month: true,
  year: true,
  usage: true,
  usageCost: true,
});

export const usageRecordExtractor = makeExtract(usageRecordFields);
export const usageRecordListExtractor = makeListExtract(usageRecordFields);
