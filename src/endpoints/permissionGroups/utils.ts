import {
  AssignPermissionGroupInput,
  AssignedPermissionGroupMeta,
  PermissionGroup,
  PermissionGroupMatcher,
  PublicAssignedPermissionGroupMeta,
  PublicPermissionGroup,
} from '../../definitions/permissionGroups';
import {PermissionAction} from '../../definitions/permissionItem';
import {Agent, SessionAgent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {getResourceId} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {assertGetWorkspaceIdFromAgent} from '../../utils/sessionUtils';
import {checkAuthorizationWithAgent} from '../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../contexts/injection/injectables';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
} from '../contexts/semantic/types';
import {InvalidRequestError, NotFoundError} from '../errors';
import {agentExtractor, workspaceResourceFields} from '../extractors';
import {checkWorkspaceExists} from '../workspaces/utils';
import {PermissionGroupDoesNotExistError} from './errors';

const assignedPermissionGroupsFields = getFields<PublicAssignedPermissionGroupMeta>({
  permissionGroupId: true,
  assignedAt: true,
  assignedBy: agentExtractor,
  assigneeEntityId: true,
});

export const assignedPermissionGroupsExtractor = makeExtract(
  assignedPermissionGroupsFields
);
export const assignedPermissionGroupsListExtractor = makeListExtract(
  assignedPermissionGroupsFields
);

const permissionGroupFields = getFields<PublicPermissionGroup>({
  ...workspaceResourceFields,
  name: true,
  description: true,
});

export const permissionGroupExtractor = makeExtract(permissionGroupFields);
export const permissionGroupListExtractor = makeListExtract(permissionGroupFields);

export async function checkPermissionGroupAuthorization(
  agent: SessionAgent,
  permissionGroup: PermissionGroup,
  action: PermissionAction,
  opts?: SemanticProviderOpParams
) {
  const workspace = await checkWorkspaceExists(permissionGroup.workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    opts,
    workspaceId: workspace.resourceId,
    target: {action, targetId: permissionGroup.resourceId},
  });
  return {agent, permissionGroup, workspace};
}

export async function checkPermissionGroupAuthorization02(
  agent: SessionAgent,
  id: string,
  action: PermissionAction
) {
  const permissionGroup = await kSemanticModels.permissionGroup().getOneById(id);
  assertPermissionGroup(permissionGroup);
  return checkPermissionGroupAuthorization(agent, permissionGroup, action);
}

export async function checkPermissionGroupAuthorization03(
  agent: SessionAgent,
  input: PermissionGroupMatcher,
  action: PermissionAction,
  opts?: SemanticProviderOpParams
) {
  let permissionGroup: PermissionGroup | null = null;

  if (!input.permissionGroupId && !input.name) {
    throw new InvalidRequestError('PermissionGroup ID or name not set');
  }

  if (input.permissionGroupId) {
    permissionGroup = await kSemanticModels
      .permissionGroup()
      .getOneById(input.permissionGroupId, opts);
  } else if (input.name) {
    const workspaceId = input.workspaceId ?? assertGetWorkspaceIdFromAgent(agent);
    permissionGroup = await kSemanticModels
      .permissionGroup()
      .getByName(workspaceId, input.name, opts);
  }

  appAssert(permissionGroup, new PermissionGroupDoesNotExistError());
  return checkPermissionGroupAuthorization(agent, permissionGroup, action);
}

export async function checkPermissionGroupsExist(
  workspaceId: string,
  permissionGroupInputs: AssignPermissionGroupInput[],
  opts?: SemanticProviderMutationParams
) {
  const idList = permissionGroupInputs.map(item => item.permissionGroupId);

  // TODO: use exists with $or or implement bulk ops
  const permissionGroups = await kSemanticModels
    .permissionGroup()
    .getManyByWorkspaceAndIdList({workspaceId, resourceIdList: idList}, opts);

  if (idList.length !== permissionGroups.length) {
    const map = indexArray(permissionGroups, {indexer: getResourceId});
    idList.forEach(id =>
      appAssert(map[id], kReuseableErrors.permissionGroup.notFound(id))
    );
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
  appAssert(permissionGroup, kReuseableErrors.permissionGroup.notFound());
}
