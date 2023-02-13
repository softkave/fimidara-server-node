import {IPermissionItem} from '../../definitions/permissionItem';
import {AppResourceType} from '../../definitions/system';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IPermissionItem>();
}

function getByContainer(containerId: string, containerType: AppResourceType) {
  return newFilter()
    .addItem('containerId', containerId, DataProviderFilterValueOperator.Equal)
    .addItem('containerType', containerType, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByResource(
  workspaceId: string,
  resourceId: string | undefined,
  resourceType: AppResourceType,
  includeWildcardTargetType = false
) {
  const filter = newFilter().addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal);

  if (resourceId) {
    filter.addItem('targetId', resourceId, DataProviderFilterValueOperator.Equal);
  }

  if (includeWildcardTargetType) {
    filter.addItem('targetType', [resourceType, AppResourceType.All], DataProviderFilterValueOperator.In);
  } else {
    filter.addItem('targetType', resourceType, DataProviderFilterValueOperator.Equal);
  }

  return filter.build();
}

function getByContainerAndResource(
  containerId: string,
  containerType: AppResourceType,
  resourceType: AppResourceType,
  resourceId?: string,
  includeWildcardTargetType = false
) {
  const filter = newFilter()
    .addItem('containerId', containerId, DataProviderFilterValueOperator.Equal)
    .addItem('containerType', containerType, DataProviderFilterValueOperator.Equal);

  if (resourceId) {
    filter.addItem('targetId', resourceId, DataProviderFilterValueOperator.Equal);
  }

  if (includeWildcardTargetType) {
    filter.addItem('targetType', [resourceType, AppResourceType.All], DataProviderFilterValueOperator.In);
  } else {
    filter.addItem('targetType', resourceType, DataProviderFilterValueOperator.Equal);
  }

  return filter.build();
}

function getByPermissionEntity(entityId: string, entityType: AppResourceType) {
  return newFilter()
    .addItem('permissionEntityId', entityId, DataProviderFilterValueOperator.Equal)
    .addItem('permissionEntityType', entityType, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByPermissionEntityAndContainer(
  entityId: string,
  entityType: AppResourceType,
  containerId: string,
  containerType: AppResourceType
) {
  return newFilter()
    .addItem('permissionEntityId', entityId, DataProviderFilterValueOperator.Equal)
    .addItem('permissionEntityType', entityType, DataProviderFilterValueOperator.Equal)
    .addItem('containerId', containerId, DataProviderFilterValueOperator.Equal)
    .addItem('containerType', containerType, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByHashList(workspaceId: string, hashList: string[]) {
  return newFilter()
    .addItem('hash', hashList, DataProviderFilterValueOperator.In)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class PermissionItemQueries {
  static getByContainer = getByContainer;
  static getByPermissionEntity = getByPermissionEntity;
  static getByResource = getByResource;
  static getByPermissionEntityAndContainer = getByPermissionEntityAndContainer;
  static getByContainerAndResource = getByContainerAndResource;
  static getByHashList = getByHashList;
}
