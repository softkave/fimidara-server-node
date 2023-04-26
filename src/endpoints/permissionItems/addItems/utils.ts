import {forEach, merge} from 'lodash';
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
import {extractResourceIdList, toNonNullableArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getResourceTypeFromId, newWorkspaceResource} from '../../../utils/resource';
import {
  sortOutPermissionItems,
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

  const getEntities = (entity: PermissionItemInputEntity) => {
    let entities: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some entities are not found?
    toNonNullableArray(entity.entityId).forEach(entityId => {
      entities[entityId] = entitiesMapById[entityId];
    });
    return entities;
  };

  const getTargets = (target: PermissionItemInputTarget) => {
    let targets: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some targets are not found?
    if (target.targetId) {
      toNonNullableArray(target.targetId).forEach(targetId => {
        targets[targetId] = targetsMapById[targetId];
      });
    }

    if (target.folderpath) {
      toNonNullableArray(target.folderpath).forEach(folderpath => {
        const folder = targetsMapByNamepath[folderpath];
        if (folder) targets[folder.resourceId] = folder;
      });
    }

    if (target.filepath) {
      toNonNullableArray(target.filepath).forEach(filepath => {
        const folder = targetsMapByNamepath[filepath];
        if (folder) targets[folder.resourceId] = folder;
      });
    }

    if (target.workspaceRootname) {
      targets[workspace.resourceId] = workspaceWrapper;
    }

    return targets;
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
        toNonNullableArray(item.target).forEach(nextTargets => {
          const nextTargetsMap = getTargets(nextTargets);

          forEach(nextTargetsMap, nextTargetFromMap => {
            const targetTypes = toNonNullableArray(
              nextTargets.targetType ?? getResourceTypeFromId(nextTargetFromMap.resourceId)
            );

            toNonNullableArray(targetTypes).forEach(nextTargetType => {
              processedItems.push({
                entity,
                action,
                target: nextTargetFromMap,
                grantAccess: item.grantAccess,
                targetType: nextTargetType,
                appliesTo: item.appliesTo,
              });
            });
          });
        });
      });
    });
  });

  let inputItems: PermissionItem[] = processedItems.map(item => {
    const targetType = getTargetType(item);
    return newWorkspaceResource(agent, AppResourceType.PermissionItem, workspace.resourceId, {
      targetType,
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
  ({items: existingPermissionItems} = sortOutPermissionItems(existingPermissionItems, p => {
    // If access is allowed (meaining a previous item already grants access)
    // and item grants access, keep item, don't fold. Will overwrite previous
    // item that granted access in map, but will keep both in filtered
    // permission items.
    if (p.isAccessAllowed && p.item.grantAccess) return true;

    // If access is denied (meaning a previous item already denies access) and
    // item does not grant access, kepp item, same as above.
    if (p.isAccessDenied && !p.item.grantAccess) return true;

    // If access is not granted nor denied (meaning no previous item grants or
    // deny access), keep item.
    if (!p.isAccessAllowed && !p.isAccessDenied) return true;

    // Filter out item.
    return false;
  }));
  ({items: existingPermissionItems} = uniquePermissionItems(
    existingPermissionItems.concat(inputItems)
  ));
  const itemsMap = indexArray(existingPermissionItems, {path: 'resourceId'});
  inputItems = inputItems.filter(item => !!itemsMap[item.resourceId]);
  await context.semantic.permissionItem.insertItem(inputItems, opts);
  return inputItems;
};
