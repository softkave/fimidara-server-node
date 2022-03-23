import {IPermissionItem} from '../../definitions/permissionItem';
import {AppResourceType} from '../../definitions/system';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<IPermissionItem>();
}

function getByOwner(ownerId: string, ownerType: AppResourceType) {
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

function getByResource(resourceId: string, resourceType: AppResourceType) {
  return newFilter()
    .addItem(
      'itemResourceId',
      resourceId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'itemResourceType',
      resourceType,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

function getByOwnerAndResource(
  ownerId: string,
  ownerType: AppResourceType,
  resourceType: AppResourceType,
  resourceId?: string
) {
  const filter = newFilter()
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

    .addItem(
      'itemResourceType',
      resourceType,
      DataProviderFilterValueOperator.Equal
    );

  if (!resourceId) {
    filter.addItem(
      'itemResourceId',
      resourceId,
      DataProviderFilterValueOperator.Equal
    );
  }

  return filter.build();
}

function getByPermissionEntity(entityId: string, entityType: AppResourceType) {
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

function getByPermissionEntityAndOwner(
  entityId: string,
  entityType: AppResourceType,
  ownerId: string,
  ownerType: AppResourceType
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

export default abstract class PermissionItemQueries {
  static getById = EndpointReusableQueries.getById;
  static getByIds = EndpointReusableQueries.getByIdsAndOrgId;
  static getByOwner = getByOwner;
  static getByPermissionEntity = getByPermissionEntity;
  static getByResource = getByResource;
  static getByOrganizationId = EndpointReusableQueries.getByOrganizationId;
  static getByPermissionEntityAndOwner = getByPermissionEntityAndOwner;
  static getByOwnerAndResource = getByOwnerAndResource;
}
