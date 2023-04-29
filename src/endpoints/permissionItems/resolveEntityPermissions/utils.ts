import {first, forEach, isString, merge, uniq} from 'lodash';
import {File} from '../../../definitions/file';
import {
  AppActionType,
  AppResourceType,
  ResourceWrapper,
  SessionAgent,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {toNonNullableArray} from '../../../utils/fns';
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
  ResolveEntityPermissionsEndpointParams,
  ResolvedEntityPermissionItemResult,
  ResolvedEntityPermissionItemTarget,
} from './types';

export const INTERNAL_resolveEntityPermissions = async (
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  data: ResolveEntityPermissionsEndpointParams
) => {
  let inputEntities: PermissionItemInputEntity[] = [];
  let inputTargets: PermissionItemInputTarget[] = [];

  if (data.entity) inputEntities = toNonNullableArray(data.entity);
  data.items.forEach(item => {
    if (item.entity) inputEntities = inputEntities.concat(toNonNullableArray(item.entity));
    if (item.target) inputTargets = inputTargets.concat(toNonNullableArray(item.target));
  });

  appAssert(inputEntities.length, new InvalidRequestError('No permission entity provided.'));

  const [entities, targets] = await Promise.all([
    getPermissionItemEntities(context, agent, workspace.resourceId, inputEntities),
    getPermissionItemTargets(context, agent, workspace, inputTargets),
  ]);

  const indexByNamePath = (item: ResourceWrapper) => {
    if (item.resourceType === AppResourceType.File || item.resourceType === AppResourceType.Folder)
      return (item.resource as unknown as Pick<File, 'namePath'>).namePath.join(
        folderConstants.nameSeparator
      );
    else return '';
  };

  const entitiesMapById = indexArray(entities, {path: 'resourceId'});
  const targetsMapById = indexArray(targets, {path: 'resourceId'});
  const targetsMapByNamepath = indexArray(targets, {indexer: indexByNamePath});
  const workspaceWrapper: ResourceWrapper = {
    resource: workspace,
    resourceId: workspace.resourceId,
    resourceType: AppResourceType.Workspace,
  };

  const getEntities = (inputEntity: PermissionItemInputEntity) => {
    let resourceEntities: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some entities are not found?
    toNonNullableArray(inputEntity.entityId).forEach(entityId => {
      if (entitiesMapById[entityId]) resourceEntities[entityId] = entitiesMapById[entityId];
    });
    return resourceEntities;
  };

  const getTargets = (inputTarget: PermissionItemInputTarget) => {
    let resourceTargets: Record<
      string,
      {resource: ResourceWrapper; resolvedTarget: ResolvedEntityPermissionItemTarget}
    > = {};

    // TODO: should we throw error when some targets are not found?
    if (inputTarget.targetId) {
      toNonNullableArray(inputTarget.targetId).forEach(targetId => {
        if (targetsMapById[targetId]) {
          resourceTargets[targetId] = {
            resource: targetsMapById[targetId],
            resolvedTarget: {targetId},
          };
        }
      });
    }

    if (inputTarget.folderpath) {
      toNonNullableArray(inputTarget.folderpath).forEach(folderpath => {
        const folder = targetsMapByNamepath[folderpath];
        if (folder)
          resourceTargets[folder.resourceId] = {resource: folder, resolvedTarget: {folderpath}};
      });
    }

    if (inputTarget.filepath) {
      toNonNullableArray(inputTarget.filepath).forEach(filepath => {
        const file = targetsMapByNamepath[filepath];
        if (file) resourceTargets[file.resourceId] = {resource: file, resolvedTarget: {filepath}};
      });
    }

    if (inputTarget.workspaceRootname) {
      resourceTargets[workspace.resourceId] = {
        resource: workspaceWrapper,
        resolvedTarget: {workspaceRootname: inputTarget.workspaceRootname},
      };
    }

    return resourceTargets;
  };

  type PermissionRequestItemToResolve = {
    entity: ResourceWrapper;
    action: AppActionType;
    target: ResourceWrapper;
    targetType?: AppResourceType;
    resolvedTarget: ResolvedEntityPermissionItemTarget;
  };

  const globalEntities = data.entity ? getEntities(data.entity) : {};
  const itemsToResolve: PermissionRequestItemToResolve[] = [];

  data.items.forEach(item => {
    const itemEntitiesMap = item.entity
      ? merge(getEntities(item.entity), globalEntities)
      : globalEntities;

    forEach(itemEntitiesMap, entity => {
      toNonNullableArray(item.action).forEach(action => {
        toNonNullableArray(item.target).forEach(nextTargets => {
          const nextTargetsMap = getTargets(nextTargets);

          forEach(nextTargetsMap, nextTargetFromMap => {
            if (nextTargets.targetType) {
              toNonNullableArray(nextTargets.targetType).forEach(nextTargetType => {
                itemsToResolve.push({
                  entity,
                  action,
                  target: nextTargetFromMap.resource,
                  targetType: nextTargetType,
                  resolvedTarget: {
                    targetId: nextTargetFromMap.resource.resourceId,
                    targetType: nextTargetType,
                  },
                });
              });
            } else {
              itemsToResolve.push({
                entity,
                action,
                target: nextTargetFromMap.resource,
                resolvedTarget: nextTargetFromMap.resolvedTarget,
              });
            }
          });
        });
      });
    });
  });

  // TODO: Better access check function
  const checkers = await Promise.all(
    itemsToResolve.map(nextItem =>
      getAuthorizationAccessChecker({
        context,
        workspace,
        workspaceId: workspace.resourceId,
        entity: nextItem.entity.resourceId,
        action: nextItem.action,
        targets: {targetId: nextItem.target.resourceId, targetType: nextItem.targetType},
        containerId: getResourcePermissionContainers(
          workspace.resourceId,
          nextItem.target.resource
        ),
      })
    )
  );

  const result: ResolvedEntityPermissionItemResult[] = itemsToResolve.map((nextItem, index) => {
    const checker = checkers[index];
    let hasAccess = false;
    if (nextItem.targetType) {
      ({hasAccess} = checker.checkForTargetType(
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
      ({hasAccess} = checker.checkForTargetId(
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
    };
  });

  return result;
};

export async function checkResolveEntityPermissionsAuth(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  data: ResolveEntityPermissionsEndpointParams
) {
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
