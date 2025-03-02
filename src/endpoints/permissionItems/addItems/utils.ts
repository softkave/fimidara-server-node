import {forEach, get, has, set} from 'lodash-es';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {File} from '../../../definitions/file.js';
import {
  FimidaraPermissionAction,
  PermissionItem,
  kFimidaraPermissionActions,
} from '../../../definitions/permissionItem.js';
import {
  FimidaraResourceType,
  ResourceWrapper,
  SessionAgent,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {
  convertToArray,
  extractResourceIdList,
  isObjectEmpty,
} from '../../../utils/fns.js';
import {indexArray} from '../../../utils/indexArray.js';
import {
  getResourceTypeFromId,
  newWorkspaceResource,
} from '../../../utils/resource.js';
import {InvalidRequestError} from '../../errors.js';
import {getPermissionItemTargets} from '../getPermissionItemTargets.js';
import {PermissionItemInputTarget} from '../types.js';
import {getPermissionItemEntities, getTargetType} from '../utils.js';
import {AddPermissionItemsEndpointParams} from './types.js';

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
  opts: SemanticProviderMutationParams
) => {
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
    getPermissionItemEntities(agent, workspace.resourceId, inputEntities),
    getPermissionItemTargets(
      agent,
      workspace,
      inputTargets,
      kFimidaraPermissionActions.updatePermission
    ),
  ]);

  const entitiesMapById = indexArray(entities, {path: 'resourceId'});
  const workspaceWrapper: ResourceWrapper = {
    resource: workspace,
    resourceId: workspace.resourceId,
    resourceType: kFimidaraResourceType.Workspace,
  };

  const getEntities = (inputEntity: string | string[]) => {
    const resourceEntities: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some entities are not found?
    convertToArray(inputEntity).forEach(entityId => {
      const entity = entitiesMapById[entityId];

      if (entity) {
        resourceEntities[entityId] = entitiesMapById[entityId];
      }
    });

    return resourceEntities;
  };

  type ProcessedPermissionItemInput = {
    entity: ResourceWrapper;
    action: FimidaraPermissionAction;
    target: ResourceWrapper;
    targetType: FimidaraResourceType;
    access: boolean;
  };

  const processedItems: ProcessedPermissionItemInput[] = [];

  data.items.forEach(item => {
    const itemEntitiesMap = getEntities(item.entityId);

    forEach(itemEntitiesMap, entity => {
      convertToArray(item.action).forEach(action => {
        const nextTarget = item;
        let {targets: nextTargetsMap} = targets.getByTarget(nextTarget);

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

  const inputItems: PermissionItem[] = processedItems.map(item => {
    const targetType = getTargetType(item);
    let targetParentId: string;

    if (
      item.target.resourceType === kFimidaraResourceType.File ||
      item.target.resourceType === kFimidaraResourceType.Folder
    ) {
      const idPath = (item.target.resource as unknown as Pick<File, 'idPath'>)
        .idPath;
      const containerId = idPath[idPath.length - 2] ?? workspace.resourceId;
      appAssert(containerId, 'Could not determine containerId');
      targetParentId = containerId;
    } else {
      targetParentId = workspace.resourceId;
    }

    return newWorkspaceResource(
      agent,
      kFimidaraResourceType.PermissionItem,
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
  const existingPermissionItems = await kIjxSemantic
    .permissions()
    .getPermissionItems({
      entityId: extractResourceIdList(entities),
      sortByDate: true,
    });

  const map: {} = {};
  existingPermissionItems.forEach(item => {
    const key = [
      item.entityId,
      item.targetId,
      item.action,
      String(item.access),
    ];

    if (!has(map, key)) {
      set(map, key, item);
    }
  });

  const newPermissions = inputItems.filter(item => {
    const key = [
      item.entityId,
      item.targetId,
      item.action,
      String(item.access),
    ];
    const wildcardKey = [
      item.entityId,
      item.targetId,
      kFimidaraPermissionActions.wildcard,
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

  await kIjxSemantic.permissionItem().insertItem(newPermissions, opts);
  return inputItems;
};
