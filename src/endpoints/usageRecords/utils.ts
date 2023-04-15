import {IFile} from '../../definitions/file';
import {AppActionType, AppResourceType, PERMISSION_AGENT_TYPES} from '../../definitions/system';
import {
  IBandwidthUsageRecordArtifact,
  IFileUsageRecordArtifact,
  IPublicUsageRecord,
  IUsageRecord,
  UsageRecordArtifactType,
  UsageRecordCategory,
} from '../../definitions/usageRecord';
import {IWorkspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {appMessages} from '../../utils/messages';
import {reuseableErrors} from '../../utils/reusableErrors';
import {getActionAgentFromSessionAgent} from '../../utils/sessionUtils';
import {IUsageRecordInput} from '../contexts/logic/UsageRecordLogicProvider';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import {fileConstants} from '../files/constants';
import RequestData from '../RequestData';
import {workspaceResourceFields} from '../utils';
import {UsageLimitExceededError} from './errors';

async function insertRecord(
  ctx: IBaseContext,
  reqData: RequestData,
  input: IUsageRecordInput,
  nothrow = false
) {
  const agent = getActionAgentFromSessionAgent(
    await ctx.session.getAgent(ctx, reqData, PERMISSION_AGENT_TYPES)
  );
  const allowed = await ctx.logic.usageRecord.insert(ctx, agent, input);
  if (!allowed && !nothrow) {
    throw new UsageLimitExceededError();
  }

  return allowed;
}

export async function insertStorageUsageRecordInput(
  ctx: IBaseContext,
  reqData: RequestData,
  file: IFile,
  action: AppActionType = AppActionType.Create,
  artifactMetaInput: Partial<IFileUsageRecordArtifact> = {},
  nothrow = false
) {
  const artifactMeta: IFileUsageRecordArtifact = {
    fileId: file.resourceId,
    filepath: file.namePath.join(fileConstants.nameExtensionSeparator),
    requestId: reqData.requestId,
    ...artifactMetaInput,
  };

  const input: IUsageRecordInput = {
    workspaceId: file.workspaceId,
    category: UsageRecordCategory.Storage,
    usage: file.size,
    artifacts: [
      {
        action,
        artifact: artifactMeta,
        type: UsageRecordArtifactType.File,
        resourceType: AppResourceType.File,
      },
    ],
  };

  await insertRecord(ctx, reqData, input, nothrow);
}

export async function insertBandwidthInUsageRecordInput(
  ctx: IBaseContext,
  reqData: RequestData,
  file: IFile,
  action: AppActionType = AppActionType.Create,
  nothrow = false
) {
  const artifactMeta: IBandwidthUsageRecordArtifact = {
    fileId: file.resourceId,
    filepath: file.namePath.join(fileConstants.nameExtensionSeparator),
    requestId: reqData.requestId,
  };

  const input: IUsageRecordInput = {
    workspaceId: file.workspaceId,
    category: UsageRecordCategory.BandwidthIn,
    usage: file.size,
    artifacts: [
      {
        action,
        artifact: artifactMeta,
        type: UsageRecordArtifactType.File,
        resourceType: AppResourceType.File,
      },
    ],
  };

  await insertRecord(ctx, reqData, input, nothrow);
}

export async function insertBandwidthOutUsageRecordInput(
  ctx: IBaseContext,
  reqData: RequestData,
  file: IFile,
  action: AppActionType = AppActionType.Read,
  nothrow = false
) {
  const artifactMeta: IBandwidthUsageRecordArtifact = {
    fileId: file.resourceId,
    filepath: file.namePath.join(fileConstants.nameExtensionSeparator),
    requestId: reqData.requestId,
  };

  const input: IUsageRecordInput = {
    workspaceId: file.workspaceId,
    category: UsageRecordCategory.BandwidthOut,
    usage: file.size,
    artifacts: [
      {
        action,
        artifact: artifactMeta,
        type: UsageRecordArtifactType.File,
        resourceType: AppResourceType.File,
      },
    ],
  };

  await insertRecord(ctx, reqData, input, nothrow);
}

// export async function insertDbObjectUsageRecordInput(
//   ctx: IBaseContext,
//   reqData: RequestData,
//   workspaceId: string,
//   resourceId: string,
//   action: BasicCRUDActions,
//   resourceType: AppResourceType,
//   nothrow: boolean = false
// ) {
//   const artifactMeta: IDatabaseObjectUsageRecordArtifact = {
//     resourceId,
//     requestId: reqData.requestId,
//   };

//   const input: IUsageRecordInput = {
//     workspaceId,
//     category: UsageRecordCategory.DatabaseObject,
//     usage: 1,
//     artifacts: [
//       {
//         action,
//         resourceType,
//         artifact: artifactMeta,
//         type: UsageRecordArtifactType.DatabaseObject,
//       },
//     ],
//   };

//   await insertRecord(ctx, reqData, input, nothrow);
// }

export function getRecordingPeriod() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  return {month: m, year: y};
}

export function getUsageThreshold(w: IWorkspace, category: UsageRecordCategory) {
  const thresholds = w.usageThresholds ?? {};
  return thresholds[category];
}

export function workspaceHasUsageThresholds(w: IWorkspace) {
  const thresholds = w.usageThresholds ?? {};
  return Object.values(UsageRecordCategory).some(k => {
    const usage = thresholds[k];
    return usage && usage.budget > 0;
  });
}

export function sumWorkspaceThresholds(w: IWorkspace, exclude?: UsageRecordCategory[]) {
  const threshold = w.usageThresholds ?? {};
  return Object.values(UsageRecordCategory).reduce((acc, k) => {
    if (exclude && exclude.includes(k)) {
      return acc;
    }

    const usage = threshold[k];
    return usage ? acc + usage.budget : acc;
  }, 0);
}

export function throwUsageRecordNotFound() {
  throw new NotFoundError(appMessages.usageRecord.notFound());
}

export function assertUsageRecord(item?: IUsageRecord | null): asserts item {
  appAssert(item, reuseableErrors.usageRecord.notFound());
}

const usageRecordFields = getFields<IPublicUsageRecord>({
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
