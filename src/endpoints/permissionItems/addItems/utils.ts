import {forEach, last, merge} from 'lodash';
import {File} from '../../../definitions/file';
import {PermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  ResourceWrapper,
  SessionAgent,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {
  extractResourceIdList,
  isObjectEmpty,
  toArray,
  toNonNullableArray,
} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getResourceTypeFromId, newWorkspaceResource} from '../../../utils/resource';
import {
  getResourcePermissionContainers,
  sortOutPermissionItems,
  sortOutPermissionItemsDefaultSelectionFn,
  uniquePermissionItems,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {InvalidRequestError} from '../../errors';
import {folderConstants} from '../../folders/constants';
import {PermissionItemInputEntity, PermissionItemInputTarget} from '../types';
import {getPermissionItemEntities, getPermissionItemTargets, getTargetType} from '../utils';
import {AddPermissionItemsEndpointParams} from './types';

export const INTERNAL_addPermissionItems = async (
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  data: AddPermissionItemsEndpointParams,
  opts: SemanticDataAccessProviderMutationRunOptions
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
    const resourceEntities: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some entities are not found?
    toNonNullableArray(inputEntity.entityId).forEach(entityId => {
      const entity = entitiesMapById[entityId];
      if (entity) resourceEntities[entityId] = entitiesMapById[entityId];
    });
    return resourceEntities;
  };

  const getTargets = (inputTarget: PermissionItemInputTarget) => {
    const resourceTargets: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some targets are not found?
    if (inputTarget.targetId) {
      toNonNullableArray(inputTarget.targetId).forEach(targetId => {
        if (targetsMapById[targetId]) resourceTargets[targetId] = targetsMapById[targetId];
      });
    }

    if (inputTarget.folderpath) {
      toNonNullableArray(inputTarget.folderpath).forEach(folderpath => {
        const folder = targetsMapByNamepath[folderpath];
        if (folder) resourceTargets[folder.resourceId] = folder;
      });
    }

    if (inputTarget.filepath) {
      toNonNullableArray(inputTarget.filepath).forEach(filepath => {
        const file = targetsMapByNamepath[filepath];
        if (file) resourceTargets[file.resourceId] = file;
      });
    }

    if (inputTarget.workspaceRootname) {
      resourceTargets[workspace.resourceId] = workspaceWrapper;
    }

    return resourceTargets;
  };

  type ProcessedPermissionItemInput = {
    entity: ResourceWrapper;
    action: AppActionType;
    target: ResourceWrapper;
    targetType: AppResourceType;
    grantAccess: boolean;
    appliesTo: PermissionItemAppliesTo;
  };

  const globalEntities = data.entity ? getEntities(data.entity) : {};
  const processedItems: ProcessedPermissionItemInput[] = [];

  data.items.forEach(item => {
    const itemEntitiesMap = item.entity
      ? merge(getEntities(item.entity), globalEntities)
      : globalEntities;

    forEach(itemEntitiesMap, entity => {
      toNonNullableArray(item.action).forEach(action => {
        toNonNullableArray(item.target).forEach(nextTarget => {
          let nextTargetsMap = getTargets(nextTarget);
          let targetTypes = toNonNullableArray(nextTarget.targetType ?? []);

          // Default to workspace if there's no target resource
          if (isObjectEmpty(nextTargetsMap) && targetTypes.length) {
            nextTargetsMap = {[workspace.resourceId]: workspaceWrapper};
          }

          forEach(nextTargetsMap, nextTargetFromMap => {
            if (targetTypes.length) {
              toNonNullableArray(targetTypes).forEach(nextTargetType => {
                if (item.appliesTo) {
                  toArray(item.appliesTo).forEach(appliesTo => {
                    processedItems.push({
                      entity,
                      action,
                      appliesTo,
                      target: nextTargetFromMap,
                      grantAccess: item.grantAccess,
                      targetType: nextTargetType,
                    });
                  });
                } else {
                  processedItems.push({
                    entity,
                    action,
                    target: nextTargetFromMap,
                    grantAccess: item.grantAccess,
                    targetType: nextTargetType,
                    appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
                  });
                }
              });
            } else {
              processedItems.push({
                entity,
                action,
                target: nextTargetFromMap,
                grantAccess: item.grantAccess,
                targetType: getResourceTypeFromId(nextTargetFromMap.resourceId),
                appliesTo: PermissionItemAppliesTo.Self,
              });
            }
          });
        });
      });
    });
  });

  let inputItems: PermissionItem[] = processedItems.map(item => {
    const targetType = getTargetType(item);
    let targetParentId: string;
    let targetParentType: AppResourceType;

    if (
      item.target.resourceType === AppResourceType.File ||
      item.target.resourceType === AppResourceType.Folder
    ) {
      const containerIds = getResourcePermissionContainers(
        workspace.resourceId,
        item.target.resource
      );
      const containerId = last(containerIds);
      appAssert(containerId);
      targetParentId = containerId;
      targetParentType = getResourceTypeFromId(containerId);
    } else {
      targetParentId = workspace.resourceId;
      targetParentType = AppResourceType.Workspace;
    }

    return newWorkspaceResource(agent, AppResourceType.PermissionItem, workspace.resourceId, {
      targetType,
      targetParentId,
      targetParentType,
      targetId: item.target.resourceId,
      action: item.action,
      entityId: item.entity.resourceId,
      entityType: item.entity.resourceType,
      grantAccess: item.grantAccess,
      appliesTo: item.appliesTo,
    });
  });

  // Not using transaction read because heavy computation may happen next to
  // filter out existing permission items, and I don't want to keep other
  // permission insertion operations waiting.
  let existingPermissionItems = await context.semantic.permissions.getPermissionItems({
    context,
    entityId: extractResourceIdList(entities),
    sortByDate: true,
  });

  // Adding custom selection function for sorting out permission items because
  // by default, `sortOutPermissionItems` folds permission items, meaning `read`
  // for example is folded into wildcard `*`, leaving a new permission item
  // granting `read` access being added again though one already exists that
  // grants that access.
  ({items: existingPermissionItems} = sortOutPermissionItems(
    existingPermissionItems,
    sortOutPermissionItemsDefaultSelectionFn,
    /** spread wildcard action and resource */ false,
    /** spread selfAndChildren appliesTo */ false
  ));
  const {items: uniquePermissions} = uniquePermissionItems(
    existingPermissionItems.concat(inputItems)
  );
  const itemsMap = indexArray(uniquePermissions, {path: 'resourceId'});
  inputItems = inputItems.filter(item => !!itemsMap[item.resourceId]);
  await context.semantic.permissionItem.insertItem(inputItems, opts);
  return inputItems;
};
