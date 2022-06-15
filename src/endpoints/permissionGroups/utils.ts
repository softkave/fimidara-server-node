import assert = require('assert');
import {
  IAssignedPermissionGroup,
  IPermissionGroup,
  IPermissionGroupInput,
  IPermissionGroupMatcher,
  IPublicPermissionGroup,
} from '../../definitions/permissionGroups';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
  ISessionAgent,
} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {indexArray} from '../../utilities/indexArray';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {assertGetWorkspaceIdFromAgent} from '../contexts/SessionContext';
import {InvalidRequestError, NotFoundError} from '../errors';
import {assignedTagListExtractor} from '../tags/utils';
import {agentExtractor} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';
import {PermissionGroupDoesNotExistError} from './errors';
import PermissionGroupQueries from './queries';

const assignedPermissionGroupsFields = getFields<IAssignedPermissionGroup>({
  permissionGroupId: true,
  assignedAt: getDateString,
  assignedBy: agentExtractor,
  order: true,
});

export const assignedPermissionGroupsExtractor = makeExtract(
  assignedPermissionGroupsFields
);
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
  permissionGroups: assignedPermissionGroupsListExtractor,
  tags: assignedTagListExtractor,
});

export const permissionGroupExtractor = makeExtract(permissionGroupFields);

export const permissionGroupListExtractor = makeListExtract(
  permissionGroupFields
);

export async function checkPermissionGroupAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  permissionGroup: IPermissionGroup,
  action: BasicCRUDActions,
  nothrow = false
) {
  const workspace = await checkWorkspaceExists(
    context,
    permissionGroup.workspaceId
  );

  await checkAuthorization({
    context,
    agent,
    workspace,
    action,
    nothrow,
    resource: permissionGroup,
    type: AppResourceType.PermissionGroup,
    permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
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
  const permissionGroup = await context.data.permissiongroup.assertGetItem(
    PermissionGroupQueries.getById(id)
  );

  return checkPermissionGroupAuthorization(
    context,
    agent,
    permissionGroup,
    action,
    nothrow
  );
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
    permissionGroup = await context.data.permissiongroup.assertGetItem(
      PermissionGroupQueries.getById(input.permissionGroupId)
    );
  } else if (input.name) {
    const workspaceId =
      input.workspaceId || assertGetWorkspaceIdFromAgent(agent);

    permissionGroup = await context.data.permissiongroup.assertGetItem(
      PermissionGroupQueries.getByWorkspaceAndName(workspaceId, input.name)
    );
  }

  assert(permissionGroup, new PermissionGroupDoesNotExistError());
  return checkPermissionGroupAuthorization(
    context,
    agent,
    permissionGroup,
    action,
    nothrow
  );
}

export async function checkPermissionGroupsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  permissionGroupInputs: IPermissionGroupInput[]
) {
  const permissionGroups = await Promise.all(
    permissionGroupInputs.map(item =>
      context.data.permissiongroup.assertGetItem(
        PermissionGroupQueries.getById(item.permissionGroupId)
      )
    )
  );

  await Promise.all(
    permissionGroups.map(item =>
      checkAuthorization({
        context,
        agent,
        workspace,
        resource: item,
        type: AppResourceType.PermissionGroup,
        permissionOwners: makeWorkspacePermissionOwnerList(
          workspace.resourceId
        ),
        action: BasicCRUDActions.Read,
      })
    )
  );

  return permissionGroups;
}

export function mergePermissionGroupsWithInput(
  permissionGroups: IAssignedPermissionGroup[],
  input: IPermissionGroupInput[],
  agent: IAgent
) {
  const inputMap = indexArray(input, {path: 'permissionGroupId'});
  return permissionGroups
    .filter(item => !inputMap[item.permissionGroupId])
    .concat(
      input.map(permissionGroup => ({
        ...permissionGroup,
        order: permissionGroup.order || Number.MAX_SAFE_INTEGER,
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
