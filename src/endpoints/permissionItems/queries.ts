import {IPermissionItem} from '../../definitions/permissionItem';
import {AppResourceType} from '../../definitions/system';
import {DataProviderFilterValueOperator} from '../contexts/data/DataProvider';
import DataProviderFilterBuilder from '../contexts/data/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IPermissionItem>();
}

function getByContainer(containerId: string) {
  return newFilter()
    .addItem('containerId', containerId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByResource(
  workspaceId: string,
  resourceId: string | undefined,
  resourceType: AppResourceType,
  includeWildcardTargetType = false
) {
  const filter = newFilter().addItem(
    'workspaceId',
    workspaceId,
    DataProviderFilterValueOperator.Equal
  );

  if (resourceId) {
    filter.addItem('targetId', resourceId, DataProviderFilterValueOperator.Equal);
  }
  if (includeWildcardTargetType) {
    filter.addItem(
      'targetType',
      [resourceType, AppResourceType.All],
      DataProviderFilterValueOperator.In
    );
  } else {
    filter.addItem('targetType', resourceType, DataProviderFilterValueOperator.Equal);
  }

  return filter.build();
}

function getByContainerAndResource(
  containerId: string,
  resourceType: AppResourceType,
  resourceId?: string,
  includeWildcardTargetType = false
) {
  const filter = newFilter().addItem(
    'containerId',
    containerId,
    DataProviderFilterValueOperator.Equal
  );

  if (resourceId) {
    filter.addItem('targetId', resourceId, DataProviderFilterValueOperator.Equal);
  }
  if (includeWildcardTargetType) {
    filter.addItem(
      'targetType',
      [resourceType, AppResourceType.All],
      DataProviderFilterValueOperator.In
    );
  } else {
    filter.addItem('targetType', resourceType, DataProviderFilterValueOperator.Equal);
  }

  return filter.build();
}

function getByPermissionEntity(entityId: string) {
  return newFilter().addItem('entityId', entityId, DataProviderFilterValueOperator.Equal).build();
}

function getByPermissionEntityAndContainer(entityId: string, containerId: string) {
  return newFilter()
    .addItem('entityId', entityId, DataProviderFilterValueOperator.Equal)
    .addItem('containerId', containerId, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class PermissionItemQueries {
  static getByContainer = getByContainer;
  static getByPermissionEntity = getByPermissionEntity;
  static getByResource = getByResource;
  static getByPermissionEntityAndContainer = getByPermissionEntityAndContainer;
  static getByContainerAndResource = getByContainerAndResource;
}
