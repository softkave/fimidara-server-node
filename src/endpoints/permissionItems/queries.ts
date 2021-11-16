import {
  IPermissionItem,
  PermissionEntityType,
} from '../../definitions/permissionItem';
import {AppResourceType} from '../../definitions/system';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IPermissionItem>();
}

function getById(id: string) {
  return newFilter()
    .addItem('itemId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByResource(ownerId: string, ownerType: AppResourceType) {
  return newFilter()
    .addItem(
      'permissionOwnerId',
      ownerId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'permissionOwnerType',
      ownerType,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

function getByPermissionEntity(
  entityId: string,
  entityType: PermissionEntityType
) {
  return newFilter()
    .addItem(
      'permissionEntityId',
      entityId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'permissionEntityType',
      entityType,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

function getByIds(ids: string[]) {
  return newFilter()
    .addItem('itemId', ids, DataProviderFilterValueOperator.In)
    .build();
}

function getByEnvironmentId(id: string) {
  return newFilter()
    .addItem('environmentId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class PermissionItemQueries {
  static getById = getById;
  static getByIds = getByIds;
  static getByResource = getByResource;
  static getByPermissionEntity = getByPermissionEntity;
  static getByEnvironmentId = getByEnvironmentId;
}
