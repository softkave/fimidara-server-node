import assert = require('assert');
import {IFile} from '../../definitions/file';
import {
  AppResourceType,
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../definitions/system';
import {
  IBandwidthUsageRecordArtifact,
  IDatabaseObjectUsageRecordArtifact,
  IFileUsageRecordArtifact,
  IRequestUsageRecordArtifact,
  UsageRecordArtifactType,
  UsageRecordCategory,
} from '../../definitions/usageRecord';
import {IBaseContext} from '../contexts/BaseContext';
import {IUsageRecordInput} from '../contexts/data-providers/UsageRecordLogicProvider';
import {getActionAgentFromSessionAgent} from '../contexts/SessionContext';
import {fileConstants} from '../files/constants';
import RequestData from '../RequestData';
import {UsageLimitExceededError} from './errors';

async function insertRecord(
  ctx: IBaseContext,
  reqData: RequestData,
  input: IUsageRecordInput
) {
  // not yet ready
  // return;

  const agent = getActionAgentFromSessionAgent(
    await ctx.session.getAgent(ctx, reqData, publicPermissibleEndpointAgents)
  );
  const allowed = await ctx.logicProviders.usageRecord.insert(
    ctx,
    reqData,
    agent,
    input
  );

  if (!allowed) {
    throw new UsageLimitExceededError();
  }
}

export async function insertStorageUsageRecordInput(
  ctx: IBaseContext,
  reqData: RequestData,
  file: IFile,
  action: BasicCRUDActions = BasicCRUDActions.Create,
  artifactMetaInput: Partial<IFileUsageRecordArtifact> = {}
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
  await insertRecord(ctx, reqData, input);
}

export async function insertBandwidthInUsageRecordInput(
  ctx: IBaseContext,
  reqData: RequestData,
  file: IFile,
  action: BasicCRUDActions = BasicCRUDActions.Create
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
  await insertRecord(ctx, reqData, input);
}

export async function insertBandwidthOutUsageRecordInput(
  ctx: IBaseContext,
  reqData: RequestData,
  file: IFile,
  action: BasicCRUDActions = BasicCRUDActions.Read
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
  await insertRecord(ctx, reqData, input);
}

export async function insertRequestUsageRecordInput(
  ctx: IBaseContext,
  reqData: RequestData,
  workspaceId: string,
  url: string,
  action: BasicCRUDActions,
  resourceType: AppResourceType
) {
  const artifactMeta: IRequestUsageRecordArtifact = {
    url,
    requestId: reqData.requestId,
  };
  const input: IUsageRecordInput = {
    workspaceId,
    category: UsageRecordCategory.Request,
    usage: 1,
    artifacts: [
      {
        action,
        resourceType,
        artifact: artifactMeta,
        type: UsageRecordArtifactType.RequestURL,
      },
    ],
  };
  await insertRecord(ctx, reqData, input);
}

export async function insertDbObjectUsageRecordInput(
  ctx: IBaseContext,
  reqData: RequestData,
  workspaceId: string,
  resourceId: string,
  action: BasicCRUDActions,
  resourceType: AppResourceType
) {
  const artifactMeta: IDatabaseObjectUsageRecordArtifact = {
    resourceId,
    requestId: reqData.requestId,
  };
  const input: IUsageRecordInput = {
    workspaceId,
    category: UsageRecordCategory.DatabaseObject,
    usage: 1,
    artifacts: [
      {
        action,
        resourceType,
        artifact: artifactMeta,
        type: UsageRecordArtifactType.DatabaseObject,
      },
    ],
  };
  await insertRecord(ctx, reqData, input);
}
