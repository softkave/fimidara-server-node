import {first, forEach, isString} from 'lodash';
import {File} from '../../../definitions/file';
import {Folder} from '../../../definitions/folder';
import {PermissionAction} from '../../../definitions/permissionItem';
import {
  Resource,
  ResourceWrapper,
  SessionAgent,
  kAppResourceType,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {toArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {
  checkAuthorizationWithAgent,
  getAuthorizationAccessChecker,
  getResourcePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticProviderRunOptions} from '../../contexts/semantic/types';
import {InvalidRequestError} from '../../errors';
import {stringifyFilenamepath} from '../../files/utils';
import {stringifyFoldernamepath} from '../../folders/utils';
import {PermissionItemInputTarget} from '../types';
import {getPermissionItemEntities, getPermissionItemTargets} from '../utils';
import {
  ResolveEntityPermissionItemInput,
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
  action: PermissionAction;
  target: ResourceWrapper;
  resolvedTarget: ResolvedEntityPermissionItemTarget;
};

/** Fetch artifacts and ensure they belong to workspace. */
async function getArtifacts(
  agent: SessionAgent,
  workspace: Workspace,
  data: ResolveEntityPermissionsEndpointParams
) {
  let inputEntities: string[] = [];
  let inputTargets: PermissionItemInputTarget[] = [];

  data.items.forEach(item => {
    if (item.entityId) inputEntities = inputEntities.concat(toArray(item.entityId));
    if (item.target) inputTargets = inputTargets.concat(toArray(item.target));
  });

  appAssert(
    inputEntities.length,
    new InvalidRequestError('No permission entity provided.')
  );
  const [entities, targets] = await Promise.all([
    getPermissionItemEntities(agent, workspace.resourceId, inputEntities),
    getPermissionItemTargets(agent, workspace, inputTargets),
  ]);

  return {entities, targets};
}

/** Index artifacts for quick retrieval. */
function indexArtifacts(
  workspace: Workspace,
  entities: ResourceWrapper<Resource>[],
  targets: ResourceWrapper<Resource>[]
) {
  const indexBynamepath = (item: ResourceWrapper) => {
    if (item.resourceType === kAppResourceType.File) {
      return stringifyFilenamepath(item.resource as unknown as File);
    } else if (item.resourceType === kAppResourceType.Folder) {
      return stringifyFoldernamepath(item.resource as unknown as Folder);
    } else {
      return '';
    }
  };

  const entitiesMapById = indexArray(entities, {path: 'resourceId'});

  // TODO: merge into one loop or update indexArray to produce more than one
  // index
  const targetsMapById = indexArray(targets, {path: 'resourceId'});
  const targetsMapBynamepath = indexArray(targets, {indexer: indexBynamepath});
  const workspaceWrapper: ResourceWrapper = {
    resource: workspace,
    resourceId: workspace.resourceId,
    resourceType: kAppResourceType.Workspace,
  };

  const getEntities = (inputEntity: string | string[]) => {
    const eMap: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some entities are not found?
    toArray(inputEntity).forEach(entityId => {
      if (entitiesMapById[entityId]) eMap[entityId] = entitiesMapById[entityId];
    });

    return eMap;
  };

  const getTargets = (inputTarget: PermissionItemInputTarget) => {
    const tMap: ResolvedTargetsMap = {};

    // TODO: should we throw error when some targets are not found?
    if (inputTarget.targetId) {
      toArray(inputTarget.targetId).forEach(targetId => {
        if (targetsMapById[targetId]) {
          tMap[targetId] = {
            resource: targetsMapById[targetId],
            resolvedTarget: {targetId},
          };
        }
      });
    }

    if (inputTarget.folderpath) {
      toArray(inputTarget.folderpath).forEach(folderpath => {
        const folder = targetsMapBynamepath[folderpath];
        if (folder)
          tMap[folder.resourceId] = {resource: folder, resolvedTarget: {folderpath}};
      });
    }

    if (inputTarget.filepath) {
      toArray(inputTarget.filepath).forEach(filepath => {
        const file = targetsMapBynamepath[filepath];
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
  agent: SessionAgent,
  workspace: Workspace,
  data: ResolveEntityPermissionsEndpointParams
) => {
  const {entities, targets} = await getArtifacts(agent, workspace, data);
  const {getEntities, getTargets} = indexArtifacts(workspace, entities, targets);

  // Requested permissions flattened to individual items, for example, list of
  // entity IDs, target IDs, target type, appliesTo, etc. flattened into
  // singular items. There's also a bit of mix-matching, matching the different
  // items to each other like target ID matched to each item in provided target
  // type, etc.
  const itemsToResolve: FlattenedPermissionRequestItem[] = [];

  function fResolvedTargetItems(
    entity: ResourceWrapper<Resource>,
    action: PermissionAction,
    tMap: ResolvedTargetsMap
  ) {
    forEach(tMap, tFromMap => {
      itemsToResolve.push({
        entity,
        action,
        target: tFromMap.resource,
        resolvedTarget: tFromMap.resolvedTarget,
      });
    });
  }
  function fTarget(
    entity: ResourceWrapper<Resource>,
    action: PermissionAction,
    item: ResolveEntityPermissionItemInput
  ) {
    toArray(item.target).forEach(target => {
      const tMap = getTargets(target);
      fResolvedTargetItems(entity, action, tMap);
    });
  }
  function fActions(
    entity: ResourceWrapper<Resource>,
    item: ResolveEntityPermissionItemInput
  ) {
    toArray(item.action).forEach(action => {
      fTarget(entity, action, item);
    });
  }
  function fEntities(item: ResolveEntityPermissionItemInput) {
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
        workspace,
        workspaceId: workspace.resourceId,
        target: {
          targetId: getResourcePermissionContainers(
            workspace.resourceId,
            nextItem.target.resource,
            true
          ),
          action: nextItem.action,
          entityId: nextItem.entity.resourceId,
        },
      })
    )
  );

  const result: ResolvedEntityPermissionItem[] = itemsToResolve.map(
    (nextItem, index): ResolvedEntityPermissionItem => {
      const checker = checkers[index];
      const {hasAccess, item} = checker.checkForTargetId(
        nextItem.entity.resourceId,
        nextItem.target.resourceId,
        nextItem.action,
        /** nothrow */ true
      );

      return {
        hasAccess,
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

export async function checkResolveEntityPermissionsAuth(
  agent: SessionAgent,
  workspace: Workspace,
  data: ResolveEntityPermissionsEndpointParams,
  opts?: SemanticProviderRunOptions
) {
  // Check is agent is resolving own permissions. If so, we don'target need to do
  // auth check.
  const isResolvingOwnPermissions = isAgentResolvingOwnPermissions(agent, data);

  if (!isResolvingOwnPermissions) {
    await checkAuthorizationWithAgent({
      agent,
      workspace,
      opts,
      workspaceId: workspace.resourceId,
      target: {targetId: workspace.resourceId, action: 'updatePermission'},
    });
  }
}

function isAgentResolvingOwnPermissions(
  agent: SessionAgent,
  data: ResolveEntityPermissionsEndpointParams
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
