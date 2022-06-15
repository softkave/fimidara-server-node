import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
} from '../../definitions/system';
import {
  UsageRecordCategory,
  UsageThresholdCategory,
} from '../../definitions/usageRecord';
import {
  IPublicWorkspace,
  IUsageThreshold,
  IWorkspace,
} from '../../definitions/workspace';
import {getDateString} from '../../utilities/dateFns';
import {
  getFields,
  makeExtract,
  makeExtractIfPresent,
  makeListExtract,
} from '../../utilities/extract';
import {checkAuthorization} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {getWorkspaceId} from '../contexts/SessionContext';
import {NotFoundError} from '../errors';
import {agentExtractor} from '../utils';

const usageThresholdSchema = getFields<IUsageThreshold>({
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  category: true,
  price: true,
});

const usageThresholdIfExistExtractor =
  makeExtractIfPresent(usageThresholdSchema);
const usageThresholdMapSchema = getFields<
  Partial<Record<UsageThresholdCategory, IUsageThreshold>>
>({
  [UsageRecordCategory.Storage]: usageThresholdIfExistExtractor,
  [UsageRecordCategory.BandwidthIn]: usageThresholdIfExistExtractor,
  [UsageRecordCategory.BandwidthOut]: usageThresholdIfExistExtractor,
  [UsageRecordCategory.Request]: usageThresholdIfExistExtractor,
  [UsageRecordCategory.DatabaseObject]: usageThresholdIfExistExtractor,
  ['total']: usageThresholdIfExistExtractor,
});

const usageThresholdMapExtractor = makeExtract(usageThresholdMapSchema);
const workspaceFields = getFields<IPublicWorkspace>({
  resourceId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  name: true,
  description: true,
  publicPermissionGroupId: true,
  billStatus: true,
  usageThresholds: usageThresholdMapExtractor,
  billStatusAssignedAt: getDateString,
});

export const workspaceExtractor = makeExtract(workspaceFields);
export const workspaceListExtractor = makeListExtract(workspaceFields);

export function throwWorkspaceNotFound() {
  throw new NotFoundError('Workspace not found');
}

export function assertWorkspace(
  workspace: IWorkspace | null | undefined
): asserts workspace {
  if (!workspace) {
    throwWorkspaceNotFound();
  }
}

export async function checkWorkspaceExists(
  ctx: IBaseContext,
  workspaceId: string
) {
  const w = await ctx.cacheProviders.workspace.getById(ctx, workspaceId);
  assertWorkspace(w);
  return w;
}

export async function checkWorkspaceExistsWithAgent(
  ctx: IBaseContext,
  agent: ISessionAgent,
  workspaceId?: string
) {
  if (!workspaceId) {
    workspaceId = getWorkspaceId(agent, workspaceId);
  }

  return checkWorkspaceExists(ctx, workspaceId);
}

export async function checkWorkspaceAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  action: BasicCRUDActions,
  nothrow = false
) {
  if (
    agent.user &&
    agent.user.workspaces.find(
      item => item.workspaceId === workspace.resourceId
    )
  ) {
    return {agent, workspace};
  }

  await checkAuthorization({
    context,
    agent,
    workspace,
    action,
    nothrow,
    resource: workspace,
    type: AppResourceType.Workspace,
    permissionOwners: [],
  });

  return {agent, workspace};
}

export async function checkWorkspaceAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const workspace = await checkWorkspaceExists(context, id);
  return checkWorkspaceAuthorization(
    context,
    agent,
    workspace,
    action,
    nothrow
  );
}

export abstract class WorkspaceUtils {
  static getPublicWorkspace = workspaceExtractor;
  static getPublicWorkspaceList = workspaceListExtractor;
  static throwWorkspaceNotFound = throwWorkspaceNotFound;
}
