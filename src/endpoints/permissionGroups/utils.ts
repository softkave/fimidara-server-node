import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
} from '../../contexts/semantic/types.js';
import {
  AssignedPermissionGroupMeta,
  PermissionGroup,
  PermissionGroupMatcher,
  PublicAssignedPermissionGroupMeta,
  PublicPermissionGroup,
} from '../../definitions/permissionGroups.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {Agent, SessionAgent} from '../../definitions/system.js';
import {appAssert} from '../../utils/assertion.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {getResourceId} from '../../utils/fns.js';
import {indexArray} from '../../utils/indexArray.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {assertGetWorkspaceIdFromAgent} from '../../utils/sessionUtils.js';
import {InvalidRequestError, NotFoundError} from '../errors.js';
import {agentExtractor, workspaceResourceFields} from '../extractors.js';
import {checkWorkspaceExists} from '../workspaces/utils.js';

const assignedPermissionGroupsFields =
  getFields<PublicAssignedPermissionGroupMeta>({
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
export const permissionGroupListExtractor = makeListExtract(
  permissionGroupFields
);

export async function checkPermissionGroupAuthorization(
  agent: SessionAgent,
  permissionGroup: PermissionGroup,
  action: FimidaraPermissionAction,
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
  action: FimidaraPermissionAction
) {
  const permissionGroup = await kIjxSemantic.permissionGroup().getOneById(id);
  assertPermissionGroup(permissionGroup);
  return checkPermissionGroupAuthorization(agent, permissionGroup, action);
}

export async function checkPermissionGroupAuthorization03(
  agent: SessionAgent,
  input: PermissionGroupMatcher,
  action: FimidaraPermissionAction,
  opts?: SemanticProviderOpParams
) {
  let permissionGroup: PermissionGroup | null = null;

  if (!input.permissionGroupId && !input.name) {
    throw new InvalidRequestError('PermissionGroup ID or name not set');
  }

  if (input.permissionGroupId) {
    permissionGroup = await kIjxSemantic
      .permissionGroup()
      .getOneById(input.permissionGroupId, opts);
  } else if (input.name) {
    const workspaceId =
      input.workspaceId ?? assertGetWorkspaceIdFromAgent(agent);
    permissionGroup = await kIjxSemantic
      .permissionGroup()
      .getByName(workspaceId, input.name, opts);
  }

  appAssert(permissionGroup, kReuseableErrors.permissionGroup.notFound());
  return checkPermissionGroupAuthorization(agent, permissionGroup, action);
}

export async function checkPermissionGroupsExist(
  workspaceId: string,
  idList: string[],
  opts?: SemanticProviderMutationParams
) {
  // TODO: use exists with $or or implement bulk ops
  const permissionGroups = await kIjxSemantic
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
  input: string[]
) {
  const inputMap = indexArray(input);
  return permissionGroups
    .filter(item => !inputMap[item.permissionGroupId])
    .concat(
      input.map(id => ({
        permissionGroupId: id,
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
