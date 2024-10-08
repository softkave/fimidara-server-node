import {DataProviderFilterValueOperator} from '../../contexts/data/DataProvider.js';
import DataProviderFilterBuilder from '../../contexts/data/DataProviderFilterBuilder.js';
import {PermissionItem} from '../../definitions/permissionItem.js';
import {
  FimidaraResourceType,
  kFimidaraResourceType,
} from '../../definitions/system.js';

function newFilter() {
  return new DataProviderFilterBuilder<PermissionItem>();
}

function getByResource(
  workspaceId: string,
  resourceId: string | undefined,
  resourceType: FimidaraResourceType,
  includeWildcardTargetType = false
) {
  const filter = newFilter().addItem(
    'workspaceId',
    workspaceId,
    DataProviderFilterValueOperator.Equal
  );

  if (resourceId) {
    filter.addItem(
      'targetId',
      resourceId,
      DataProviderFilterValueOperator.Equal
    );
  }

  if (includeWildcardTargetType) {
    filter.addItem(
      'targetType',
      [resourceType, kFimidaraResourceType.All],
      DataProviderFilterValueOperator.In
    );
  } else {
    filter.addItem(
      'targetType',
      resourceType,
      DataProviderFilterValueOperator.Equal
    );
  }

  return filter.build();
}

function getByPermissionEntity(entityId: string) {
  return newFilter()
    .addItem('entityId', entityId, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class PermissionItemQueries {
  static getByPermissionEntity = getByPermissionEntity;
  static getByResource = getByResource;
}
