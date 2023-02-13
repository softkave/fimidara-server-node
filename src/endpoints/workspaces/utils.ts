import {identity} from 'lodash';
import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {UsageRecordCategory} from '../../definitions/usageRecord';
import {IPublicWorkspace, IUsageThreshold, IWorkspace} from '../../definitions/workspace';
import {getDateString, getDateStringIfPresent} from '../../utils/dateFns';
import {getFields, makeExtract, makeExtractIfPresent, makeListExtract} from '../../utils/extract';
import {checkAuthorization} from '../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../contexts/SessionContext';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import folderValidationSchemas from '../folders/validation';
import EndpointReusableQueries from '../queries';
import {agentExtractor} from '../utils';

const usageThresholdSchema = getFields<IUsageThreshold>({
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  category: true,
  budget: true,
});

const usageThresholdIfExistExtractor = makeExtractIfPresent(usageThresholdSchema);

const usageThresholdMapSchema = getFields<Partial<Record<UsageRecordCategory, IUsageThreshold>>>({
  [UsageRecordCategory.Storage]: usageThresholdIfExistExtractor,
  [UsageRecordCategory.BandwidthIn]: usageThresholdIfExistExtractor,
  [UsageRecordCategory.BandwidthOut]: usageThresholdIfExistExtractor,
  // [UsageRecordCategory.Request]: usageThresholdIfExistExtractor,
  // [UsageRecordCategory.DatabaseObject]: usageThresholdIfExistExtractor,
  [UsageRecordCategory.Total]: usageThresholdIfExistExtractor,
});

const usageThresholdMapExtractorIfExist = makeExtractIfPresent(usageThresholdMapSchema);

const workspaceFields = getFields<IPublicWorkspace>({
  resourceId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  name: true,
  rootname: true,
  description: true,
  publicPermissionGroupId: true,
  billStatus: true,
  usageThresholds: identity,
  usageThresholdLocks: identity,
  billStatusAssignedAt: getDateStringIfPresent,
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
  const w = await ctx.data.workspace.getOneByQuery(EndpointReusableQueries.getByResourceId(workspaceId));
  assertWorkspace(w);
  return w;
}

export async function checkWorkspaceExistsWithAgent(ctx: IBaseContext, agent: ISessionAgent, workspaceId?: string) {
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
  if (agent.user && agent.user.workspaces.find(item => item.workspaceId === workspace.resourceId)) {
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
    permissionContainers: [],
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
  return checkWorkspaceAuthorization(context, agent, workspace, action, nothrow);
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
