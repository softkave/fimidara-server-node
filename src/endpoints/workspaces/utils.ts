import {AppActionType, SessionAgent} from '../../definitions/system';
import {UsageRecordCategory} from '../../definitions/usageRecord';
import {
  PublicUsageThreshold,
  PublicUsageThresholdLock,
  PublicWorkspace,
  Workspace,
} from '../../definitions/workspace';
import {
  ExtractFieldsFrom,
  getFields,
  makeExtract,
  makeExtractIfPresent,
  makeListExtract,
} from '../../utils/extract';
import {getWorkspaceIdFromSessionAgent, getWorkspaceIdNoThrow} from '../../utils/sessionUtils';
import {checkAuthorization} from '../contexts/authorizationChecks/checkAuthorizaton';
import {BaseContextType} from '../contexts/types';
import {NotFoundError} from '../errors';
import folderValidationSchemas from '../folders/validation';
import {EndpointOptionalWorkspaceIDParam} from '../types';
import {agentExtractor, workspaceResourceFields} from '../utils';

const usageThresholdSchema = getFields<PublicUsageThreshold>({
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: true,
  category: true,
  budget: true,
});
const usageThresholdLockSchema = getFields<PublicUsageThresholdLock>({
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: true,
  category: true,
  locked: true,
});

const usageThresholdIfExistExtractor = makeExtractIfPresent(usageThresholdSchema);
const usageThresholdLockIfExistExtractor = makeExtractIfPresent(usageThresholdLockSchema);

const f: ExtractFieldsFrom<PublicWorkspace> = {
  ...workspaceResourceFields,
  name: true,
  rootname: true,
  description: true,
  publicPermissionGroupId: true,
  billStatus: true,
  billStatusAssignedAt: true,
  usageThresholds: data => {
    const extract = {} as PublicWorkspace['usageThresholds'];
    for (const key in data) {
      extract[key as UsageRecordCategory] = usageThresholdIfExistExtractor(
        data[key as UsageRecordCategory]
      );
    }
    return extract;
  },
  usageThresholdLocks: data => {
    const extract = {} as PublicWorkspace['usageThresholdLocks'];
    for (const key in data) {
      extract[key as UsageRecordCategory] = usageThresholdLockIfExistExtractor(
        data[key as UsageRecordCategory]
      );
    }
    return extract;
  },
};
const workspaceFields = getFields<PublicWorkspace>(f);

export const workspaceExtractor = makeExtract(workspaceFields);
export const workspaceListExtractor = makeListExtract(workspaceFields);

export function throwWorkspaceNotFound() {
  throw new NotFoundError('Workspace not found');
}

export function assertWorkspace(workspace: Workspace | null | undefined): asserts workspace {
  if (!workspace) {
    throwWorkspaceNotFound();
  }
}

export async function checkWorkspaceExists(ctx: BaseContextType, workspaceId: string) {
  const w = await ctx.semantic.workspace.getOneById(workspaceId);
  assertWorkspace(w);
  return w;
}

export async function checkWorkspaceExistsWithAgent(
  ctx: BaseContextType,
  agent: SessionAgent,
  workspaceId?: string
) {
  if (!workspaceId) {
    workspaceId = getWorkspaceIdFromSessionAgent(agent, workspaceId);
  }
  return checkWorkspaceExists(ctx, workspaceId);
}

export async function checkWorkspaceAuthorization(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  action: AppActionType
) {
  await checkAuthorization({
    context,
    agent,
    action,
    workspace,
    workspaceId: workspace.resourceId,
    targets: {targetId: workspace.resourceId},
  });
  return {agent, workspace};
}

export async function checkWorkspaceAuthorization02(
  context: BaseContextType,
  agent: SessionAgent,
  action: AppActionType,
  id?: string
) {
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, id);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  return checkWorkspaceAuthorization(context, agent, workspace, action);
}

export abstract class WorkspaceUtils {
  static getPublicWorkspace = workspaceExtractor;
  static getPublicWorkspaceList = workspaceListExtractor;
  static throwWorkspaceNotFound = throwWorkspaceNotFound;
}

export function makeRootnameFromName(name: string): string {
  return name
    .replace(new RegExp(folderValidationSchemas.notNameRegex, 'g'), ' ')
    .replace(/[\s-]+/g, '-')
    .toLowerCase();
}

export async function getWorkspaceFromEndpointInput(
  context: BaseContextType,
  agent: SessionAgent,
  data: EndpointOptionalWorkspaceIDParam
) {
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  return {workspace};
}

export async function tryGetWorkspaceFromEndpointInput(
  context: BaseContextType,
  agent: SessionAgent,
  data: EndpointOptionalWorkspaceIDParam
) {
  let workspace: Workspace | undefined = undefined;
  const workspaceId = getWorkspaceIdNoThrow(agent, data.workspaceId);
  if (workspaceId) workspace = await checkWorkspaceExists(context, workspaceId);
  return {workspace};
}
