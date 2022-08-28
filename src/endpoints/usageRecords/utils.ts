import {IFile} from '../../definitions/file';
import {
  AppResourceType,
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../definitions/system';
import {
  IBandwidthUsageRecordArtifact,
  IFileUsageRecordArtifact,
  UsageRecordArtifactType,
  UsageRecordCategory,
} from '../../definitions/usageRecord';
import {IWorkspace} from '../../definitions/workspace';
import {IUsageRecordInput} from '../contexts/data-providers/UsageRecordLogicProvider';
import {getActionAgentFromSessionAgent} from '../contexts/SessionContext';
import {IBaseContext} from '../contexts/types';
import {fileConstants} from '../files/constants';
import RequestData from '../RequestData';
import {UsageLimitExceededError} from './errors';

async function insertRecord(
  ctx: IBaseContext,
  reqData: RequestData,
  input: IUsageRecordInput,
  nothrow = false
) {
  const agent = getActionAgentFromSessionAgent(
    await ctx.session.getAgent(ctx, reqData, publicPermissibleEndpointAgents)
  );

  const allowed = await ctx.logicProviders.usageRecord.insert(
    ctx,
    reqData,
    agent,
    input
  );

  if (!allowed && !nothrow) {
    throw new UsageLimitExceededError();
  }

  return allowed;
}

export async function insertStorageUsageRecordInput(
  ctx: IBaseContext,
  reqData: RequestData,
  file: IFile,
  action: BasicCRUDActions = BasicCRUDActions.Create,
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
  action: BasicCRUDActions = BasicCRUDActions.Create,
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
  action: BasicCRUDActions = BasicCRUDActions.Read,
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

export function getUsageThreshold(
  w: IWorkspace,
  category: UsageRecordCategory
) {
  const thresholds = w.usageThresholds || {};
  return thresholds[category];
}

export function workspaceHasUsageThresholds(w: IWorkspace) {
  const thresholds = w.usageThresholds || {};
  return Object.values(UsageRecordCategory).some(k => {
    const usage = thresholds[k];
    return usage && usage.budget > 0;
  });
}

export function sumWorkspaceThresholds(
  w: IWorkspace,
  exclude?: UsageRecordCategory[]
) {
  const threshold = w.usageThresholds || {};
  return Object.values(UsageRecordCategory).reduce((acc, k) => {
    if (exclude && exclude.includes(k)) {
      return acc;
    }

    const usage = threshold[k];
    return usage ? acc + usage.budget : acc;
  }, 0);
}
