import {IWorkspace, IPublicWorkspace} from '../../definitions/workspace';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {checkAuthorization} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {getWorkspaceId} from '../contexts/SessionContext';
import {NotFoundError} from '../errors';
import {agentExtractor} from '../utils';
import WorkspaceQueries from './queries';

const workspaceFields = getFields<IPublicWorkspace>({
  resourceId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  name: true,
  description: true,
  publicPresetId: true,
});

export const workspaceExtractor = makeExtract(workspaceFields);
export const workspaceListExtractor = makeListExtract(workspaceFields);

export function throwWorkspaceNotFound() {
  throw new NotFoundError('Workspace not found');
}

export async function checkWorkspaceExists(
  ctx: IBaseContext,
  workspaceId: string
) {
  return await ctx.data.workspace.assertGetItem(
    WorkspaceQueries.getById(workspaceId)
  );
}

export async function checkWorkspaceExistsWithAgent(
  ctx: IBaseContext,
  agent: ISessionAgent,
  workspaceId?: string
) {
  if (!workspaceId) {
    workspaceId = getWorkspaceId(agent, workspaceId);
  }

  return await ctx.data.workspace.assertGetItem(
    WorkspaceQueries.getById(workspaceId)
  );
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
  const workspace = await context.data.workspace.assertGetItem(
    WorkspaceQueries.getById(id)
  );

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
