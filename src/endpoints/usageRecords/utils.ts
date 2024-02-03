import {File} from '../../definitions/file';
import {PermissionAction} from '../../definitions/permissionItem';
import {kAppResourceType, kPermissionAgentTypes} from '../../definitions/system';
import {
  BandwidthUsageRecordArtifact,
  FileUsageRecordArtifact,
  PublicUsageRecord,
  UsageRecord,
  UsageRecordArtifactTypeMap,
  UsageRecordCategory,
  UsageRecordCategoryMap,
} from '../../definitions/usageRecord';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {kAppMessages} from '../../utils/messages';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {getActionAgentFromSessionAgent} from '../../utils/sessionUtils';
import {kUtilsInjectables} from '../contexts/injection/injectables';
import {UsageRecordInput} from '../contexts/logic/UsageRecordLogicProvider';
import {SemanticProviderMutationRunOptions} from '../contexts/semantic/types';
import {NotFoundError} from '../errors';
import {workspaceResourceFields} from '../extractors';
import {stringifyFilenamepath} from '../files/utils';
import RequestData from '../RequestData';

import {UsageLimitExceededError} from './errors';

async function insertRecord(
  reqData: RequestData,
  input: UsageRecordInput,
  opts: SemanticProviderMutationRunOptions,
  nothrow = false
) {
  const agent = getActionAgentFromSessionAgent(
    await kUtilsInjectables.session().getAgent(reqData, kPermissionAgentTypes)
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
  action: PermissionAction,
  artifactMetaInput: Partial<FileUsageRecordArtifact> = {},
  opts: SemanticProviderMutationRunOptions,
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
        resourceType: kAppResourceType.File,
      },
    ],
  };

  await insertRecord(reqData, input, opts, nothrow);
}

export async function insertBandwidthInUsageRecordInput(
  reqData: RequestData,
  file: File,
  action: PermissionAction,
  opts: SemanticProviderMutationRunOptions,
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
        resourceType: kAppResourceType.File,
      },
    ],
  };

  await insertRecord(reqData, input, opts, nothrow);
}

export async function insertBandwidthOutUsageRecordInput(
  reqData: RequestData,
  file: File,
  action: PermissionAction,
  opts: SemanticProviderMutationRunOptions,
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
        resourceType: kAppResourceType.File,
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
//   resourceType: AppResourceType,
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
