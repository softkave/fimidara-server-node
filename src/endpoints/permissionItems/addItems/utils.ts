import {forEach, get, has, set} from 'lodash';
import {File} from '../../../definitions/file';
import {
  PermissionAction,
  PermissionItem,
  kPermissionsMap,
} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  AppResourceTypeMap,
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
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {InvalidRequestError} from '../../errors';
import {kFolderConstants} from '../../folders/constants';
import {PermissionItemInputTarget} from '../types';
import {
  getPermissionItemEntities,
  getPermissionItemTargets,
  getTargetType,
} from '../utils';
import {AddPermissionItemsEndpointParams} from './types';
import {kSemanticModels} from '../../contexts/injectables';

/**
 * - separate entities, separate targets
 * - fetch entities, fetch targets
 * - confirm entities and targets belong to workspace
 * - fetch permissions for entity + target
 * - fold permissions into wildcard for access and no access
 * - save remaining permissions
 */

export const INTERNAL_addPermissionItems = async (
  agent: SessionAgent,
  workspace: Workspace,
  data: AddPermissionItemsEndpointParams,
  opts: SemanticProviderMutationRunOptions
) => {
  let inputEntities: string[] = [];
  let inputTargets: PermissionItemInputTarget[] = [];

  data.items.forEach(item => {
    if (item.entityId) {
      inputEntities = inputEntities.concat(toArray(item.entityId));
    }

    if (item.target) {
      inputTargets = inputTargets.concat(toArray(item.target));
    }
  });

  appAssert(
    inputEntities.length,
    new InvalidRequestError('No permission entity provided.')
  );

  const [entities, targets] = await Promise.all([
    getPermissionItemEntities(agent, workspace.resourceId, inputEntities),
    getPermissionItemTargets(agent, workspace, inputTargets),
  ]);

  const indexBynamepath = (item: ResourceWrapper) => {
    if (
      item.resourceType === AppResourceTypeMap.File ||
      item.resourceType === AppResourceTypeMap.Folder
    ) {
      return (item.resource as unknown as Pick<File, 'namepath'>).namepath.join(
        kFolderConstants.separator
      );
    } else {
      return '';
    }
  };

  const entitiesMapById = indexArray(entities, {path: 'resourceId'});
  const targetsMapById = indexArray(targets, {path: 'resourceId'});
  const targetsMapBynamepath = indexArray(targets, {indexer: indexBynamepath});
  const workspaceWrapper: ResourceWrapper = {
    resource: workspace,
    resourceId: workspace.resourceId,
    resourceType: AppResourceTypeMap.Workspace,
  };

  const getEntities = (inputEntity: string | string[]) => {
    const resourceEntities: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some entities are not found?
    toArray(inputEntity).forEach(entityId => {
      const entity = entitiesMapById[entityId];

      if (entity) {
        resourceEntities[entityId] = entitiesMapById[entityId];
      }
    });

    return resourceEntities;
  };

  const getTargets = (inputTarget: PermissionItemInputTarget) => {
    const resourceTargets: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some targets are not found?
    if (inputTarget.targetId) {
      toNonNullableArray(inputTarget.targetId).forEach(targetId => {
        if (targetsMapById[targetId])
          resourceTargets[targetId] = targetsMapById[targetId];
      });
    }

    if (inputTarget.folderpath) {
      toNonNullableArray(inputTarget.folderpath).forEach(folderpath => {
        const folder = targetsMapBynamepath[folderpath];
        if (folder) resourceTargets[folder.resourceId] = folder;
      });
    }

    if (inputTarget.filepath) {
      toNonNullableArray(inputTarget.filepath).forEach(filepath => {
        const file = targetsMapBynamepath[filepath];
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
    action: PermissionAction;
    target: ResourceWrapper;
    targetType: AppResourceType;
    access: boolean;
  };

  const processedItems: ProcessedPermissionItemInput[] = [];

  data.items.forEach(item => {
    const itemEntitiesMap = getEntities(item.entityId);

    forEach(itemEntitiesMap, entity => {
      toNonNullableArray(item.action).forEach(action => {
        toNonNullableArray(item.target).forEach(nextTarget => {
          let nextTargetsMap = getTargets(nextTarget);

          // Default to workspace if there's no target resource
          if (isObjectEmpty(nextTargetsMap)) {
            nextTargetsMap = {[workspace.resourceId]: workspaceWrapper};
          }

          forEach(nextTargetsMap, nextTargetFromMap => {
            processedItems.push({
              entity,
              action,
              target: nextTargetFromMap,
              access: item.access,
              targetType: getResourceTypeFromId(nextTargetFromMap.resourceId),
            });
          });
        });
      });
    });
  });

  const inputItems: PermissionItem[] = processedItems.map(item => {
    const targetType = getTargetType(item);
    let targetParentId: string;

    if (
      item.target.resourceType === AppResourceTypeMap.File ||
      item.target.resourceType === AppResourceTypeMap.Folder
    ) {
      const idPath = (item.target.resource as unknown as Pick<File, 'idPath'>).idPath;
      const containerId = idPath[idPath.length - 2] ?? workspace.resourceId;
      appAssert(containerId);
      targetParentId = containerId;
    } else {
      targetParentId = workspace.resourceId;
    }

    return newWorkspaceResource(
      agent,
      AppResourceTypeMap.PermissionItem,
      workspace.resourceId,
      {
        targetType,
        targetParentId,
        targetId: item.target.resourceId,
        action: item.action,
        entityId: item.entity.resourceId,
        entityType: item.entity.resourceType,
        access: item.access,
      }
    );
  });

  // Not using transaction read because heavy computation may happen next to
  // filter out existing permission items, and I don't want to keep other
  // permission insertion operations waiting.
  const existingPermissionItems = await kSemanticModels.permissions().getPermissionItems({
    entityId: extractResourceIdList(entities),
    sortByDate: true,
  });

  const map: {} = {};
  existingPermissionItems.forEach(item => {
    const key = [item.entityId, item.targetId, item.action, String(item.access)];

    if (!has(map, key)) {
      set(map, key, item);
    }
  });

  const newPermissions = inputItems.filter(item => {
    const key = [item.entityId, item.targetId, item.action, String(item.access)];
    const wildcardKey = [
      item.entityId,
      item.targetId,
      kPermissionsMap.wildcard,
      String(item.access),
    ];
    const existingItem = get(map, key);
    const wildcardItem = get(map, wildcardKey);
    const isNew = !existingItem && !wildcardItem;

    if (isNew) {
      set(map, key, item);
    }

    return isNew;
  });

  await kSemanticModels.permissionItem().insertItem(newPermissions, opts);
  return inputItems;
};
