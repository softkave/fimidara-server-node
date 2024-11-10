import {first, forEach, isString} from 'lodash-es';
import {
  checkAuthorizationWithAgent,
  getAuthorizationAccessChecker,
  getResourcePermissionContainers,
} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {SemanticProviderOpParams} from '../../../contexts/semantic/types.js';
import {
  FimidaraPermissionAction,
  kFimidaraPermissionActions,
} from '../../../definitions/permissionItem.js';
import {
  Resource,
  ResourceWrapper,
  SessionAgent,
} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {convertToArray} from '../../../utils/fns.js';
import {indexArray} from '../../../utils/indexArray.js';
import {InvalidRequestError} from '../../errors.js';
import {getPermissionItemTargets} from '../getPermissionItemTargets.js';
import {PermissionItemInputTarget} from '../types.js';
import {getPermissionItemEntities} from '../utils.js';
import {
  ResolvePermissionItemInput,
  ResolvePermissionsEndpointParams,
  ResolvedPermissionItem,
  ResolvedPermissionItemTarget,
} from './types.js';

type ResolvedTargetItem = ResourceWrapper & ResolvedPermissionItemTarget;
type ResolvedTargetsMap = Record<string, ResolvedTargetItem>;
type FlattenedPermissionRequestItem = {
  entity: ResourceWrapper;
  action: FimidaraPermissionAction;
  target: ResourceWrapper;
  resolvedTarget: ResolvedPermissionItemTarget;
};

/** Fetch artifacts and ensure they belong to workspace. */
async function getArtifacts(
  agent: SessionAgent,
  workspaceId: string,
  data: ResolvePermissionsEndpointParams
) {
  let inputEntities: string[] = [];
  let inputTargets: PermissionItemInputTarget[] = [];

  data.items.forEach(item => {
    if (item.entityId) {
      inputEntities = inputEntities.concat(convertToArray(item.entityId));
    }

    inputTargets = inputTargets.concat(convertToArray(item));
  });

  appAssert(
    inputEntities.length,
    new InvalidRequestError('No permission entity provided')
  );
  const [entities, targets] = await Promise.all([
    getPermissionItemEntities(agent, workspaceId, inputEntities),
    getPermissionItemTargets(
      agent,
      workspaceId,
      inputTargets,
      kFimidaraPermissionActions.readPermission
    ),
  ]);

  return {entities, targets};
}

/** Index artifacts for quick retrieval. */
function indexArtifacts(entities: ResourceWrapper<Resource>[]) {
  const entitiesMapById = indexArray(entities, {path: 'resourceId'});
  const getEntities = (inputEntity: string | string[]) => {
    const eMap: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some entities are not found?
    convertToArray(inputEntity).forEach(entityId => {
      if (entitiesMapById[entityId]) eMap[entityId] = entitiesMapById[entityId];
    });

    return eMap;
  };

  return {getEntities};
}

export const resolvePermissions = async (
  agent: SessionAgent,
  workspaceId: string,
  data: ResolvePermissionsEndpointParams
) => {
  const {entities, targets} = await getArtifacts(agent, workspaceId, data);
  const {getEntities} = indexArtifacts(entities);

  // Requested permissions flattened to individual items, for example, list of
  // entity IDs, target IDs, target type, appliesTo, etc. flattened into
  // singular items. There's also a bit of mix-matching, matching the different
  // items to each other like target ID matched to each item in provided target
  // type, etc.
  const itemsToResolve: FlattenedPermissionRequestItem[] = [];

  function fResolvedTargetItems(
    entity: ResourceWrapper<Resource>,
    action: FimidaraPermissionAction,
    tMap: ResolvedTargetsMap
  ) {
    forEach(tMap, tFromMap => {
      itemsToResolve.push({
        entity,
        action,
        target: tFromMap,
        resolvedTarget: tFromMap,
      });
    });
  }

  function fTarget(
    entity: ResourceWrapper<Resource>,
    action: FimidaraPermissionAction,
    item: ResolvePermissionItemInput
  ) {
    const {targets: tMap} = targets.getByTarget(item);
    fResolvedTargetItems(entity, action, tMap);
  }

  function fActions(
    entity: ResourceWrapper<Resource>,
    item: ResolvePermissionItemInput
  ) {
    convertToArray(item.action).forEach(action => {
      fTarget(entity, action, item);
    });
  }

  function fEntities(item: ResolvePermissionItemInput) {
    const itemEntitiesMap = getEntities(item.entityId);

    forEach(itemEntitiesMap, entity => {
      fActions(entity, item);
    });
  }

  data.items.forEach(fEntities);

  // TODO: Better access check function
  const checkers = await Promise.all(
    itemsToResolve.map(nextItem =>
      getAuthorizationAccessChecker({
        workspaceId,
        target: {
          targetId: getResourcePermissionContainers(
            workspaceId,
            nextItem.target.resource,
            true
          ),
          action: nextItem.action,
          entityId: nextItem.entity.resourceId,
        },
      })
    )
  );

  const result: ResolvedPermissionItem[] = itemsToResolve.map(
    (nextItem, index): ResolvedPermissionItem => {
      const checker = checkers[index];
      const {hasAccess, item} = checker.checkForTargetId(
        nextItem.entity.resourceId,
        nextItem.target.resourceId,
        nextItem.action,
        /** nothrow */ true
      );

      return {
        access: hasAccess,
        action: nextItem.action,
        entityId: nextItem.entity.resourceId,
        target: nextItem.resolvedTarget,
        permittingEntityId: item?.entityId,
        permittingTargetId: item?.targetId,
      };
    }
  );

  return result;
};

export async function checkResolvePermissionsAuth(
  agent: SessionAgent,
  workspaceId: string,
  data: ResolvePermissionsEndpointParams,
  opts?: SemanticProviderOpParams
) {
  // Check is agent is resolving own permissions. If so, we don'target need to do
  // auth check.
  const isResolvingOwnPermissions = isAgentResolvingOwnPermissions(agent, data);

  if (!isResolvingOwnPermissions) {
    await checkAuthorizationWithAgent({
      agent,
      opts,
      workspaceId,
      target: {
        targetId: workspaceId,
        action: kFimidaraPermissionActions.readPermission,
      },
    });
  }
}

function isAgentResolvingOwnPermissions(
  agent: SessionAgent,
  data: ResolvePermissionsEndpointParams
) {
  let hasEntity = false;

  for (const nextItem of data.items) {
    if (nextItem.entityId) {
      hasEntity = true;
      const isSame = isAgentSameAsEntity(agent, nextItem.entityId);

      if (!isSame) return false;
    }
  }

  if (hasEntity) return true;
  else return false;
}

function isAgentSameAsEntity(agent: SessionAgent, entity: string | string[]) {
  if (isString(entity)) return agent.agentId === entity;
  return entity.length === 1 && first(entity) === agent.agentId;
}
