import {uniqBy} from 'lodash';
import {ResourceWithPermissionGroupsAndTags} from '../../../definitions/assignedItem';
import {IPermissionGroup} from '../../../definitions/permissionGroups';
import {AppResourceType} from '../../../definitions/system';
import {indexArray} from '../../../utils/indexArray';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import PermissionGroupQueries from '../../permissionGroups/queries';
import {IBaseContext} from '../types';
import {IPermissionEntity} from './getPermissionEntities';

// Add entity to the container if it's not already added
const addEntity = (
  container: Array<IPermissionEntity>,
  processedEntities: Record<string, true>,
  entity: IPermissionEntity
) => {
  // To prevent processing cyclic dependencies cause they'd cause an infinite loop
  if (!processedEntities[entity.permissionEntityId]) {
    container.push(entity);
    processedEntities[entity.permissionEntityId] = true;
  }
};

// Commit a list of entities using their IDs
const commitEntities = (
  entityIds: Array<string>,
  permissionGroupsMap: Record<string, ResourceWithPermissionGroupsAndTags<IPermissionGroup> | null>,

  // Entities originally gotten from the agent performing the operation
  existingEntitiesMap: Record<string, IPermissionEntity>,
  container: Array<IPermissionEntity>,
  processedEntities: Record<string, true>
) => {
  for (const id of entityIds) {
    if (existingEntitiesMap[id]) {
      addEntity(container, processedEntities, existingEntitiesMap[id]);
    }

    const permissionGroup = permissionGroupsMap[id];

    if (!permissionGroup) {
      continue;
    }

    addEntity(container, processedEntities, {
      permissionEntityId: permissionGroup.resourceId,
      permissionEntityType: AppResourceType.PermissionGroup,
    });

    commitEntities(
      permissionGroup.permissionGroups.map(item => item.permissionGroupId),
      permissionGroupsMap,
      existingEntitiesMap,
      container,
      processedEntities
    );
  }

  return container;
};

const extractUniqueEntitiesAndAssignOrder = (entities: Array<IPermissionEntity>) => {
  const uniqueEntities = uniqBy(entities, <keyof IPermissionEntity>'permissionEntityId');

  uniqueEntities.forEach((entity, index) => {
    entity.order = index;
  });

  return uniqueEntities;
};

async function fetchPermissionGroups(context: IBaseContext, inputEntities: Array<IPermissionEntity>) {
  const permissionGroupsMap: Record<string, ResourceWithPermissionGroupsAndTags<IPermissionGroup> | null> = {};

  const permissionGroupEntitiesIds = inputEntities
    .filter(item => {
      return item.permissionEntityType === AppResourceType.PermissionGroup;
    })
    .map(item => item.permissionEntityId);

  // Start with the input entities that are permissionGroups
  let iterationIds: string[] = permissionGroupEntitiesIds;

  while (iterationIds.length > 0) {
    const permissionGroups = await Promise.all(
      iterationIds.map(async id => {
        if (permissionGroupsMap[id]) {
          // Reuse permissionGroup if we've fetched it already, otherwise fetch if we
          // don't have it
          return permissionGroupsMap[id];
        }

        const permissionGroup = await context.data.permissiongroup.getOneByQuery(PermissionGroupQueries.getById(id));

        if (permissionGroup) {
          return populateAssignedPermissionGroupsAndTags(
            context,
            permissionGroup.workspaceId,
            permissionGroup,
            AppResourceType.PermissionGroup
          );
        }

        return null;
      })
    );

    // Empty the IDs we've fetched so that we can reuse the list
    iterationIds = [];

    // Insert the IDs of the assigned permissionGroups of the permissionGroups we've fetched, and
    // mark the permissionGroups fetched, so that they can be reused
    permissionGroups.forEach(permissionGroup => {
      if (permissionGroup) {
        permissionGroupsMap[permissionGroup.resourceId] = permissionGroup;
        permissionGroup.permissionGroups.forEach(item => iterationIds.push(item.permissionGroupId));
      }
    });
  }
  return permissionGroupsMap;
}

export async function fetchAndSortPermissionGroups(context: IBaseContext, entities: IPermissionEntity[]) {
  const permissionGroupsMap = await fetchPermissionGroups(context, entities);
  const processedEntities = commitEntities(
    entities.map(item => item.permissionEntityId),
    permissionGroupsMap,
    indexArray(entities, {path: 'permissionEntityId'}),
    [], // container
    {} // processed entities map
  );

  return extractUniqueEntitiesAndAssignOrder(processedEntities);
}
