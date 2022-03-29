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

function getByResource(
  organizationId: string,
  resourceId: string | undefined,
  resourceType: AppResourceType,
  includeWildcard = false
) {
  const filter = newFilter().addItem(
    'organizationId',
    organizationId,
    DataProviderFilterValueOperator.Equal
  );

  if (resourceId) {
    filter.addItem(
      'itemResourceId',
      resourceId,
      DataProviderFilterValueOperator.Equal
    );
  }

  if (includeWildcard) {
    filter.addItem(
      'itemResourceType',
      [resourceType, AppResourceType.All],
      DataProviderFilterValueOperator.In
    );
  } else {
    filter.addItem(
      'itemResourceType',
      resourceType,
      DataProviderFilterValueOperator.Equal
    );
  }

  return filter.build();
}

function getByOwnerAndResource(
  ownerId: string,
  ownerType: AppResourceType,
  resourceType: AppResourceType,
  resourceId?: string,
  includeWildcard = false
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
    );

  if (resourceId) {
    filter.addItem(
      'itemResourceId',
      resourceId,
      DataProviderFilterValueOperator.Equal
    );
  }

  if (includeWildcard) {
    filter.addItem(
      'itemResourceType',
      [resourceType, AppResourceType.All],
      DataProviderFilterValueOperator.In
    );
  } else {
    filter.addItem(
      'itemResourceType',
      resourceType,
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
