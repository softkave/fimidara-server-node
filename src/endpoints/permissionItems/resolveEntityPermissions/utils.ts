import {first, forEach, isString, merge, uniq} from 'lodash';
import {File} from '../../../definitions/file';
import {PermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  Resource,
  ResourceWrapper,
  SessionAgent,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {toArray, toNonNullableArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {
  checkAuthorization,
  getAuthorizationAccessChecker,
  getResourcePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {BaseContextType} from '../../contexts/types';
import {InvalidRequestError} from '../../errors';
import {folderConstants} from '../../folders/constants';
import {PermissionItemInputEntity, PermissionItemInputTarget} from '../types';
import {getPermissionItemEntities, getPermissionItemTargets} from '../utils';
import {
  ResolveEntityPermissionItemInput,
  ResolveEntityPermissionItemInputTarget,
  ResolveEntityPermissionsEndpointParams,
  ResolvedEntityPermissionItem,
  ResolvedEntityPermissionItemTarget,
} from './types';

type ResolvedTargetItem = {
  resource: ResourceWrapper;
  resolvedTarget: ResolvedEntityPermissionItemTarget;
};
type ResolvedTargetsMap = Record<string, ResolvedTargetItem>;
type FlattenedPermissionRequestItem = {
  entity: ResourceWrapper;
  action: AppActionType;
  target: ResourceWrapper;
  targetType?: AppResourceType;
  containerAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  targetAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  resolvedTarget: ResolvedEntityPermissionItemTarget;
};

/** Fetch artifacts and ensure they belong to workspace. */
async function getArtifacts(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  data: ResolveEntityPermissionsEndpointParams
) {
  let inputEntities: PermissionItemInputEntity[] = [];
  let inputTargets: PermissionItemInputTarget[] = [];

  if (data.entity) inputEntities = toArray(data.entity);
  data.items.forEach(item => {
    if (item.entity) inputEntities = inputEntities.concat(toArray(item.entity));
    if (item.target) inputTargets = inputTargets.concat(toArray(item.target));
  });

  appAssert(inputEntities.length, new InvalidRequestError('No permission entity provided.'));
  const [entities, targets] = await Promise.all([
    getPermissionItemEntities(context, agent, workspace.resourceId, inputEntities),
    getPermissionItemTargets(context, agent, workspace, inputTargets),
  ]);

  return {entities, targets};
}

/** Index artifacts for quick retrieval. */
function indexArtifacts(
  workspace: Workspace,
  entities: ResourceWrapper<Resource>[],
  targets: ResourceWrapper<Resource>[]
) {
  const indexByNamePath = (item: ResourceWrapper) => {
    if (item.resourceType === AppResourceType.File || item.resourceType === AppResourceType.Folder)
      return (item.resource as unknown as Pick<File, 'namePath'>).namePath.join(
        folderConstants.nameSeparator
      );
    else return '';
  };

  const entitiesMapById = indexArray(entities, {path: 'resourceId'});

  // TODO: merge into one loop or update indexArray to produce more than one
  // index
  const targetsMapById = indexArray(targets, {path: 'resourceId'});
  const targetsMapByNamepath = indexArray(targets, {indexer: indexByNamePath});
  const workspaceWrapper: ResourceWrapper = {
    resource: workspace,
    resourceId: workspace.resourceId,
    resourceType: AppResourceType.Workspace,
  };

  const getEntities = (inputEntity: PermissionItemInputEntity) => {
    let eMap: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some entities are not found?
    toNonNullableArray(inputEntity.entityId).forEach(entityId => {
      if (entitiesMapById[entityId]) eMap[entityId] = entitiesMapById[entityId];
    });
    return eMap;
  };

  const getTargets = (inputTarget: PermissionItemInputTarget) => {
    let tMap: ResolvedTargetsMap = {};

    // TODO: should we throw error when some targets are not found?
    if (inputTarget.targetId) {
      toNonNullableArray(inputTarget.targetId).forEach(targetId => {
        if (targetsMapById[targetId]) {
          tMap[targetId] = {
            resource: targetsMapById[targetId],
            resolvedTarget: {targetId},
          };
        }
      });
    }

    if (inputTarget.folderpath) {
      toNonNullableArray(inputTarget.folderpath).forEach(folderpath => {
        const folder = targetsMapByNamepath[folderpath];
        if (folder) tMap[folder.resourceId] = {resource: folder, resolvedTarget: {folderpath}};
      });
    }

    if (inputTarget.filepath) {
      toNonNullableArray(inputTarget.filepath).forEach(filepath => {
        const file = targetsMapByNamepath[filepath];
        if (file) tMap[file.resourceId] = {resource: file, resolvedTarget: {filepath}};
      });
    }

    if (inputTarget.workspaceRootname) {
      tMap[workspace.resourceId] = {
        resource: workspaceWrapper,
        resolvedTarget: {workspaceRootname: inputTarget.workspaceRootname},
      };
    }

    return tMap;
  };

  return {getTargets, getEntities};
}

export const INTERNAL_resolveEntityPermissions = async (
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  data: ResolveEntityPermissionsEndpointParams
) => {
  const {entities, targets} = await getArtifacts(context, agent, workspace, data);
  const {getEntities, getTargets} = indexArtifacts(workspace, entities, targets);

  // Top-level entity added to all items
  const gEntity = data.entity ? getEntities(data.entity) : {};

  // Requested permissions flattened to individual items, for example, list of
  // entity IDs, target IDs, target type, appliesTo, etc. flattened into
  // singular items. There's also a bit of mix-matching, matching the different
  // items to each other like target ID matched to each item in provided target
  // type, etc.
  const itemsToResolve: FlattenedPermissionRequestItem[] = [];

  function fResolvedTargetItems(
    entity: ResourceWrapper<Resource>,
    action: AppActionType,
    tMap: ResolvedTargetsMap,
    t: ResolveEntityPermissionItemInputTarget,
    item: ResolveEntityPermissionItemInput
  ) {
    forEach(tMap, tFromMap => {
      if (t.targetType) {
        toArray(t.targetType).forEach(tType => {
          itemsToResolve.push({
            entity,
            action,
            target: tFromMap.resource,
            targetType: tType,
            resolvedTarget: {
              targetId: tFromMap.resource.resourceId,
              targetType: tType,
            },
            containerAppliesTo: item.containerAppliesTo,
            targetAppliesTo: item.targetAppliesTo,
          });
        });
      } else {
        itemsToResolve.push({
          entity,
          action,
          target: tFromMap.resource,
          resolvedTarget: tFromMap.resolvedTarget,
        });
      }
    });
  }
  function fTarget(
    entity: ResourceWrapper<Resource>,
    action: AppActionType,
    item: ResolveEntityPermissionItemInput
  ) {
    toArray(item.target).forEach(t => {
      const tMap = getTargets(t);
      fResolvedTargetItems(entity, action, tMap, t, item);
    });
  }
  function fActions(entity: ResourceWrapper<Resource>, item: ResolveEntityPermissionItemInput) {
    toArray(item.action).forEach(action => {
      fTarget(entity, action, item);
    });
  }
  function fEntities(item: ResolveEntityPermissionItemInput) {
    const itemEntitiesMap = item.entity ? merge(getEntities(item.entity), gEntity) : gEntity;

    forEach(itemEntitiesMap, entity => {
      fActions(entity, item);
    });
  }

  data.items.forEach(fEntities);

  // TODO: Better access check function
  const checkers = await Promise.all(
    itemsToResolve.map(nextItem =>
      getAuthorizationAccessChecker({
        context,
        workspace,
        workspaceId: workspace.resourceId,
        entity: nextItem.entity.resourceId,
        action: nextItem.action,
        targets: {
          targetId: nextItem.target.resourceId,
          targetType: nextItem.targetType,
          containerAppliesTo: nextItem.containerAppliesTo,
          targetAppliesTo: nextItem.targetAppliesTo,
        },
        containerId: getResourcePermissionContainers(
          workspace.resourceId,
          nextItem.target.resource
        ),
      })
    )
  );

  const result: ResolvedEntityPermissionItem[] = itemsToResolve.map(
    (nextItem, index): ResolvedEntityPermissionItem => {
      const checker = checkers[index];
      let hasAccess = false;
      let item: PermissionItem | undefined = undefined;

      if (nextItem.targetType) {
        ({hasAccess, item} = checker.checkForTargetType(
          nextItem.targetType,
          nextItem.action,
          uniq(
            getResourcePermissionContainers(workspace.resourceId, nextItem.target.resource).concat(
              nextItem.target.resourceId
            )
          ),
          /** nothrow */ true
        ));
      } else {
        ({hasAccess, item} = checker.checkForTargetId(
          nextItem.target.resourceId,
          nextItem.action,
          getResourcePermissionContainers(workspace.resourceId, nextItem.target.resource),
          /** nothrow */ true
        ));
      }

      return {
        hasAccess,
        action: nextItem.action,
        entityId: nextItem.entity.resourceId,
        target: nextItem.resolvedTarget,
        containerAppliesTo: nextItem.containerAppliesTo,
        targetAppliesTo: nextItem.targetAppliesTo,
        accessEntityId: item?.entityId,
        // accessTargetId: item?.targetId,
        // accessTargetType: item?.targetType,
      };
    }
  );

  return result;
};

export async function checkResolveEntityPermissionsAuth(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  data: ResolveEntityPermissionsEndpointParams
) {
  // Check is agent is resolving own permissions. If so, we don't need to do
  // auth check.
  const isResolvingOwnPermissions = isAgentResolvingOwnPermissions(agent, data);

  if (!isResolvingOwnPermissions) {
    await checkAuthorization({
      context,
      agent,
      workspace,
      workspaceId: workspace.resourceId,
      action: AppActionType.Read,
      targets: {targetType: AppResourceType.PermissionItem},
    });
  }
}

function isAgentResolvingOwnPermissions(
  agent: SessionAgent,
  data: ResolveEntityPermissionsEndpointParams
) {
  let hasEntity = false;

  if (data.entity) {
    hasEntity = true;
    let isSame = isAgentSameAsEntity(agent, data.entity);
    if (!isSame) return false;
  }

  for (const nextItem of data.items) {
    if (nextItem.entity) {
      hasEntity = true;
      const isSame = isAgentSameAsEntity(agent, nextItem.entity);
      if (!isSame) return false;
    }
  }

  if (hasEntity) return true;
  else return false;
}

function isAgentSameAsEntity(agent: SessionAgent, entity: PermissionItemInputEntity) {
  if (isString(entity.entityId)) return agent.agentId === entity.entityId;
  return entity.entityId.length === 1 && first(entity.entityId) === agent.agentId;
}
