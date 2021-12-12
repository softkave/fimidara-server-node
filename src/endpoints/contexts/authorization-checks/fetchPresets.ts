import {uniqBy} from 'lodash';
import {IPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
import {AppResourceType} from '../../../definitions/system';
import {indexArray} from '../../../utilities/indexArray';
import PresetPermissionsGroupQueries from '../../presetPermissionsGroups/queries';
import {IBaseContext} from '../BaseContext';
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
  presetsMap: Record<string, IPresetPermissionsGroup | null>,

  // Entities originally gotten from the agent performing the operation
  existingEntitiesMap: Record<string, IPermissionEntity>,
  container: Array<IPermissionEntity>,
  processedEntities: Record<string, true>
) => {
  for (const id of entityIds) {
    if (existingEntitiesMap[id]) {
      addEntity(container, processedEntities, existingEntitiesMap[id]);
    }

    const preset = presetsMap[id];

    if (!preset) {
      continue;
    }

    addEntity(container, processedEntities, {
      permissionEntityId: preset.presetId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
    });

    commitEntities(
      preset.presets.map(item => item.presetId),
      presetsMap,
      existingEntitiesMap,
      container,
      processedEntities
    );
  }

  return container;
};

const extractUniqueEntitiesAndAssignOrder = (
  entities: Array<IPermissionEntity>
) => {
  const uniqueEntities = uniqBy(
    entities,
    <keyof IPermissionEntity>'permissionEntityId'
  );

  uniqueEntities.forEach((entity, index) => {
    entity.order = index;
  });

  return uniqueEntities;
};

async function fetchPresets(
  context: IBaseContext,
  inputEntities: Array<IPermissionEntity>
) {
  const presetsMap: Record<string, IPresetPermissionsGroup | null> = {};
  const presetEntitiesIds = inputEntities
    .filter(
      item =>
        item.permissionEntityType === AppResourceType.PresetPermissionsGroup
    )
    .map(item => item.permissionEntityId);

  // Start with the input entities that are presets
  let iterationIds: string[] = presetEntitiesIds;

  while (iterationIds.length > 0) {
    const presets = await Promise.all(
      iterationIds.map(
        id =>
          // Reuse preset if we've fetched it already, otherwise fetch if we don't have it
          presetsMap[id] ||
          context.data.presetPermissionsGroup.getItem(
            PresetPermissionsGroupQueries.getById(id)
          )
      )
    );

    // Empty the IDs we've fetched so that we can reuse the list
    iterationIds = [];

    // Insert the IDs of the assigned presets of the presets we've fetched, and
    // mark the presets fetched, so that they can be reused
    presets.forEach(preset => {
      if (preset) {
        presetsMap[preset.presetId] = preset;
        preset.presets.forEach(item => iterationIds.push(item.presetId));
      }
    });
  }
  return presetsMap;
}

export async function fetchAndSortPresets(
  context: IBaseContext,
  entities: IPermissionEntity[]
) {
  const presetsMap: Record<
    string,
    IPresetPermissionsGroup | null
  > = await fetchPresets(context, entities);

  const processedEntities = commitEntities(
    entities.map(item => item.permissionEntityId),
    presetsMap,
    indexArray(entities, {path: 'permissionEntityId'}),
    [], // container
    {} // processed entities map
  );

  return extractUniqueEntitiesAndAssignOrder(processedEntities);
}
