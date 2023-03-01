import {
  IAssignedPermissionGroupMeta,
  IAssignPermissionGroupInput,
  IPermissionGroup,
  IPermissionGroupMatcher,
  IPublicPermissionGroup,
} from '../../definitions/permissionGroups';
import {BasicCRUDActions, IAgent, ISessionAgent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {getResourceId} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {reuseableErrors} from '../../utils/reusableErrors';
import {assertGetWorkspaceIdFromAgent} from '../../utils/sessionUtils';
import {checkAuthorization} from '../contexts/authorization-checks/checkAuthorizaton';
import {INCLUDE_IN_PROJECTION} from '../contexts/data/types';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError, NotFoundError} from '../errors';
import EndpointReusableQueries from '../queries';
import {agentExtractor, workspaceResourceFields} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';
import {PermissionGroupDoesNotExistError} from './errors';

const assignedPermissionGroupsFields = getFields<IAssignedPermissionGroupMeta>({
  permissionGroupId: true,
  assignedAt: true,
  assignedBy: agentExtractor,
  assignedToEntityId: true,
});

export const assignedPermissionGroupsExtractor = makeExtract(assignedPermissionGroupsFields);
export const assignedPermissionGroupsListExtractor = makeListExtract(
  assignedPermissionGroupsFields
);

const permissionGroupFields = getFields<IPublicPermissionGroup>({
  ...workspaceResourceFields,
  name: true,
  description: true,
  // tags: assignedTagListExtractor,
});

export const permissionGroupExtractor = makeExtract(permissionGroupFields);
export const permissionGroupListExtractor = makeListExtract(permissionGroupFields);

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
    action,
    nothrow,
    workspaceId: workspace.resourceId,
    targets: [{targetId: permissionGroup.resourceId}],
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
  workspaceId: string,
  permissionGroupInputs: IAssignPermissionGroupInput[]
) {
  const idList = permissionGroupInputs.map(item => item.permissionGroupId);
  const permissionGroups = await context.data.permissiongroup.getManyByQuery(
    EndpointReusableQueries.getByWorkspaceIdAndResourceIdList(workspaceId, idList),
    {projection: {resourceId: INCLUDE_IN_PROJECTION}}
  );
  if (idList.length !== permissionGroups.length) {
    const permissionGroupsMap = indexArray(permissionGroups, {indexer: getResourceId});
    idList.forEach(id =>
      appAssert(
        permissionGroupsMap[id],
        new NotFoundError(`Permission group with ID ${id} not found.`)
      )
    );
  }

  await checkAuthorization({
    context,
    agent,
    workspaceId,
    targets: idList.map(id => ({targetId: id})),
    action: BasicCRUDActions.Read,
  });
}

export function mergePermissionGroupsWithInput(
  agent: IAgent,
  entityId: string,
  permissionGroups: IAssignedPermissionGroupMeta[],
  input: IAssignPermissionGroupInput[]
) {
  const inputMap = indexArray(input, {path: 'permissionGroupId'});
  return permissionGroups
    .filter(item => !inputMap[item.permissionGroupId])
    .concat(
      input.map(permissionGroup => ({
        ...permissionGroup,
        assignedAt: getTimestamp(),
        assignedBy: agent,
        assignedToEntityId: entityId,
      }))
    );
}

export function throwPermissionGroupNotFound() {
  throw new NotFoundError('PermissionGroup permissions group not found');
}

export function assertPermissionGroup(
  permissionGroup?: IPermissionGroup | null
): asserts permissionGroup {
  appAssert(permissionGroup, reuseableErrors.permissionGroup.notFound());
}
