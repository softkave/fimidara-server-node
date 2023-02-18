import {
  IAssignedPermissionGroupMeta,
  IAssignPermissionGroupInput,
  IPermissionGroup,
  IPermissionGroupMatcher,
  IPublicPermissionGroup,
  IPublicPermissionGroupWithAssignedPermissionGroupsMeta,
} from '../../definitions/permissionGroups';
import {AppResourceType, BasicCRUDActions, IAgent, ISessionAgent} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getDateString} from '../../utils/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {assertGetWorkspaceIdFromAgent} from '../contexts/SessionContext';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError, NotFoundError} from '../errors';
import EndpointReusableQueries from '../queries';
import {assignedTagListExtractor} from '../tags/utils';
import {agentExtractor} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';
import {PermissionGroupDoesNotExistError} from './errors';

const assignedPermissionGroupsFields = getFields<IAssignedPermissionGroupMeta>({
  permissionGroupId: true,
  assignedAt: getDateString,
  assignedBy: agentExtractor,
  order: true,
});

export const assignedPermissionGroupsExtractor = makeExtract(assignedPermissionGroupsFields);
export const assignedPermissionGroupsListExtractor = makeListExtract(
  assignedPermissionGroupsFields
);

const permissionGroupFields = getFields<IPublicPermissionGroup>({
  resourceId: true,
  workspaceId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  lastUpdatedAt: getDateString,
  lastUpdatedBy: agentExtractor,
  name: true,
  description: true,
  tags: assignedTagListExtractor,
});

export const permissionGroupExtractor = makeExtract(permissionGroupFields);
export const permissionGroupListExtractor = makeListExtract(permissionGroupFields);

const permissionGroupWithAssignedMetaFields =
  getFields<IPublicPermissionGroupWithAssignedPermissionGroupsMeta>({
    resourceId: true,
    workspaceId: true,
    createdAt: getDateString,
    createdBy: agentExtractor,
    lastUpdatedAt: getDateString,
    lastUpdatedBy: agentExtractor,
    name: true,
    description: true,
    tags: assignedTagListExtractor,
    assignedPermissionGroupsMeta: assignedPermissionGroupsListExtractor,
  });

export const permissionGroupWithAssignedMetaExtractor = makeExtract(
  permissionGroupWithAssignedMetaFields
);
export const permissionGroupWithAssignedMetaListExtractor = makeListExtract(
  permissionGroupWithAssignedMetaFields
);

export async function checkPermissionGroupAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  permissionGroup: IPermissionGroup,
  action: BasicCRUDActions,
  nothrow = false
) {
  const workspace = await checkWorkspaceExists(context, permissionGroup.workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    action,
    nothrow,
    targetId: permissionGroup.resourceId,
    type: AppResourceType.PermissionGroup,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
  });

  return {agent, permissionGroup, workspace};
}

export async function checkPermissionGroupAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const permissionGroup = await context.data.permissiongroup.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(id)
  );
  return checkPermissionGroupAuthorization(context, agent, permissionGroup, action, nothrow);
}

export async function checkPermissionGroupAuthorization03(
  context: IBaseContext,
  agent: ISessionAgent,
  input: IPermissionGroupMatcher,
  action: BasicCRUDActions,
  nothrow = false
) {
  let permissionGroup: IPermissionGroup | null = null;
  if (!input.permissionGroupId && !input.name) {
    throw new InvalidRequestError('PermissionGroup ID or name not set');
  }

  if (input.permissionGroupId) {
    permissionGroup = await context.data.permissiongroup.assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(input.permissionGroupId)
    );
  } else if (input.name) {
    const workspaceId = input.workspaceId ?? assertGetWorkspaceIdFromAgent(agent);
    permissionGroup = await context.data.permissiongroup.assertGetOneByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndName(workspaceId, input.name)
    );
  }

  appAssert(permissionGroup, new PermissionGroupDoesNotExistError());
  return checkPermissionGroupAuthorization(context, agent, permissionGroup, action, nothrow);
}

export async function checkPermissionGroupsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  permissionGroupInputs: IAssignPermissionGroupInput[]
) {
  const permissionGroups = await Promise.all(
    permissionGroupInputs.map(item =>
      context.data.permissiongroup.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(item.permissionGroupId)
      )
    )
  );

  await Promise.all(
    permissionGroups.map(item =>
      checkAuthorization({
        context,
        agent,
        workspace,
        targetId: item.resourceId,
        type: AppResourceType.PermissionGroup,
        permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
        action: BasicCRUDActions.Read,
      })
    )
  );

  return permissionGroups;
}

export function mergePermissionGroupsWithInput(
  permissionGroups: IAssignedPermissionGroupMeta[],
  input: IAssignPermissionGroupInput[],
  agent: IAgent
) {
  const inputMap = indexArray(input, {path: 'permissionGroupId'});
  return permissionGroups
    .filter(item => !inputMap[item.permissionGroupId])
    .concat(
      input.map(permissionGroup => ({
        ...permissionGroup,
        order: permissionGroup.order ?? Number.MAX_SAFE_INTEGER,
        assignedAt: getDateString(),
        assignedBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
      }))
    );
}

export function throwPermissionGroupNotFound() {
  throw new NotFoundError('PermissionGroup permissions group not found');
}
