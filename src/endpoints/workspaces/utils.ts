import {BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {UsageRecordCategory} from '../../definitions/usageRecord';
import {
  IPublicUsageThreshold,
  IPublicUsageThresholdLock,
  IPublicWorkspace,
  IWorkspace,
} from '../../definitions/workspace';
import {getFields, makeExtract, makeExtractIfPresent, makeListExtract} from '../../utils/extract';
import {getWorkspaceIdFromSessionAgent} from '../../utils/sessionUtils';
import {checkAuthorization} from '../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import folderValidationSchemas from '../folders/validation';
import {agentExtractor, workspaceResourceFields} from '../utils';

const usageThresholdSchema = getFields<IPublicUsageThreshold>({
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: true,
  category: true,
  budget: true,
});
const usageThresholdLockSchema = getFields<IPublicUsageThresholdLock>({
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: true,
  category: true,
  locked: true,
});

const usageThresholdIfExistExtractor = makeExtractIfPresent(usageThresholdSchema);
const usageThresholdLockIfExistExtractor = makeExtractIfPresent(usageThresholdLockSchema);

const workspaceFields = getFields<IPublicWorkspace>({
  ...workspaceResourceFields,
  name: true,
  rootname: true,
  description: true,
  publicPermissionGroupId: true,
  billStatus: true,
  billStatusAssignedAt: true,
  usageThresholds: data => {
    const extract = {} as IPublicWorkspace['usageThresholds'];
    for (const key in data) {
      extract[key as UsageRecordCategory] = usageThresholdIfExistExtractor(
        data[key as UsageRecordCategory]
      );
    }
    return extract;
  },
  usageThresholdLocks: data => {
    const extract = {} as IPublicWorkspace['usageThresholdLocks'];
    for (const key in data) {
      extract[key as UsageRecordCategory] = usageThresholdLockIfExistExtractor(
        data[key as UsageRecordCategory]
      );
    }
    return extract;
  },
});

export const workspaceExtractor = makeExtract(workspaceFields);
export const workspaceListExtractor = makeListExtract(workspaceFields);

export function throwWorkspaceNotFound() {
  throw new NotFoundError('Workspace not found');
}

export function assertWorkspace(workspace: IWorkspace | null | undefined): asserts workspace {
  if (!workspace) {
    throwWorkspaceNotFound();
  }
}

export async function checkWorkspaceExists(ctx: IBaseContext, workspaceId: string) {
  const w = await ctx.semantic.workspace.getOneById(workspaceId);
  assertWorkspace(w);
  return w;
}

export async function checkWorkspaceExistsWithAgent(
  ctx: IBaseContext,
  agent: ISessionAgent,
  workspaceId?: string
) {
  if (!workspaceId) {
    workspaceId = getWorkspaceIdFromSessionAgent(agent, workspaceId);
  }
  return checkWorkspaceExists(ctx, workspaceId);
}

export async function checkWorkspaceAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  action: BasicCRUDActions
) {
  await checkAuthorization({
    context,
    agent,
    action,
    workspaceId: workspace.resourceId,
    targets: [{targetId: workspace.resourceId}],
  });
  return {agent, workspace};
}

export async function checkWorkspaceAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  action: BasicCRUDActions,
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
