import {
  AssignPermissionGroupInput,
  AssignedPermissionGroupMeta,
  PermissionGroup,
  PermissionGroupMatcher,
  PublicAssignedPermissionGroupMeta,
  PublicPermissionGroup,
} from '../../definitions/permissionGroups';
import {Agent, AppActionType, SessionAgent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {getResourceId} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {reuseableErrors} from '../../utils/reusableErrors';
import {assertGetWorkspaceIdFromAgent} from '../../utils/sessionUtils';
import {checkAuthorization} from '../contexts/authorizationChecks/checkAuthorizaton';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {InvalidRequestError, NotFoundError} from '../errors';
import {agentExtractor, workspaceResourceFields} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';
import {PermissionGroupDoesNotExistError} from './errors';

const assignedPermissionGroupsFields = getFields<PublicAssignedPermissionGroupMeta>({
  permissionGroupId: true,
  assignedAt: true,
  assignedBy: agentExtractor,
  assigneeEntityId: true,
});

export const assignedPermissionGroupsExtractor = makeExtract(assignedPermissionGroupsFields);
export const assignedPermissionGroupsListExtractor = makeListExtract(
  assignedPermissionGroupsFields
);

const permissionGroupFields = getFields<PublicPermissionGroup>({
  ...workspaceResourceFields,
  name: true,
  description: true,
  // tags: assignedTagListExtractor,
});

export const permissionGroupExtractor = makeExtract(permissionGroupFields);
export const permissionGroupListExtractor = makeListExtract(permissionGroupFields);

export async function checkPermissionGroupAuthorization(
  context: BaseContextType,
  agent: SessionAgent,
  permissionGroup: PermissionGroup,
  action: AppActionType
) {
  const workspace = await checkWorkspaceExists(context, permissionGroup.workspaceId);
  await checkAuthorization({
    context,
    agent,
    action,
    workspace,
    workspaceId: workspace.resourceId,
    targets: {targetId: permissionGroup.resourceId},
  });
  return {agent, permissionGroup, workspace};
}

export async function checkPermissionGroupAuthorization02(
  context: BaseContextType,
  agent: SessionAgent,
  id: string,
  action: AppActionType
) {
  const permissionGroup = await context.semantic.permissionGroup.getOneById(id);
  assertPermissionGroup(permissionGroup);
  return checkPermissionGroupAuthorization(context, agent, permissionGroup, action);
}

export async function checkPermissionGroupAuthorization03(
  context: BaseContextType,
  agent: SessionAgent,
  input: PermissionGroupMatcher,
  action: AppActionType,
  opts?: SemanticDataAccessProviderRunOptions
) {
  let permissionGroup: PermissionGroup | null = null;
  if (!input.permissionGroupId && !input.name) {
    throw new InvalidRequestError('PermissionGroup ID or name not set');
  }

  if (input.permissionGroupId) {
    permissionGroup = await context.semantic.permissionGroup.getOneById(
      input.permissionGroupId,
      opts
    );
  } else if (input.name) {
    const workspaceId = input.workspaceId ?? assertGetWorkspaceIdFromAgent(agent);
    permissionGroup = await context.semantic.permissionGroup.getByName(
      workspaceId,
      input.name,
      opts
    );
  }

  appAssert(permissionGroup, new PermissionGroupDoesNotExistError());
  return checkPermissionGroupAuthorization(context, agent, permissionGroup, action);
}

export async function checkPermissionGroupsExist(
  context: BaseContextType,
  workspaceId: string,
  permissionGroupInputs: AssignPermissionGroupInput[],
  opts?: SemanticDataAccessProviderMutationRunOptions
) {
  const idList = permissionGroupInputs.map(item => item.permissionGroupId);

  // TODO: use exists with $or or implement bulk ops
  const permissionGroups = await context.semantic.permissionGroup.getManyByWorkspaceAndIdList(
    {workspaceId, resourceIdList: idList},
    opts
  );

  if (idList.length !== permissionGroups.length) {
    const map = indexArray(permissionGroups, {indexer: getResourceId});
    idList.forEach(id => appAssert(map[id], reuseableErrors.permissionGroup.notFound(id)));
  }
}

export function mergePermissionGroupsWithInput(
  agent: Agent,
  entityId: string,
  permissionGroups: AssignedPermissionGroupMeta[],
  input: AssignPermissionGroupInput[]
) {
  const inputMap = indexArray(input, {path: 'permissionGroupId'});
  return permissionGroups
    .filter(item => !inputMap[item.permissionGroupId])
    .concat(
      input.map(permissionGroup => ({
        ...permissionGroup,
        assignedAt: getTimestamp(),
        assignedBy: agent,
        assigneeEntityId: entityId,
      }))
    );
}

export function throwPermissionGroupNotFound() {
  throw new NotFoundError('PermissionGroup permissions group not found');
}

export function assertPermissionGroup(
  permissionGroup?: PermissionGroup | null
): asserts permissionGroup {
  appAssert(permissionGroup, reuseableErrors.permissionGroup.notFound());
}
