import {DataProviderFilterValueOperator} from './contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from './contexts/data-providers/DataProviderFilterBuilder';

function getByOrganizationId(id: string) {
  return new DataProviderFilterBuilder<{organizationId: string}>()
    .addItem('organizationId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByOrganizationAndName(organizationId: string, name: string) {
  return new DataProviderFilterBuilder<{organizationId: string; name: string}>()
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'name',
      new RegExp(`^${name}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

function getById(id: string) {
  return new DataProviderFilterBuilder<{resourceId: string}>()
    .addItem('resourceId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByIdsAndOrgId(ids: string[], organizationId: string) {
  return new DataProviderFilterBuilder<{
    resourceId: string;
    organizationId: string;
  }>()
    .addItem('resourceId', ids, DataProviderFilterValueOperator.In)
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

function getByIds(ids: string[]) {
  return new DataProviderFilterBuilder<{
    resourceId: string;
  }>()
    .addItem('resourceId', ids, DataProviderFilterValueOperator.In)
    .build();
}

function getByOrgIdAndIds(organizationId: string, ids: string[]) {
  return new DataProviderFilterBuilder<{
    resourceId: string;
    organizationId: string;
  }>()
    .addItem('resourceId', ids, DataProviderFilterValueOperator.In)
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

function getByProvidedId(organizationId: string, id: string) {
  return new DataProviderFilterBuilder<{
    providedResourceId: string;
    organizationId: string;
  }>()
    .addItem('providedResourceId', id, DataProviderFilterValueOperator.Equal)
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

export default abstract class EndpointReusableQueries {
  static getByOrganizationId = getByOrganizationId;
  static getByOrganizationAndName = getByOrganizationAndName;
  static getById = getById;
  static getByIdsAndOrgId = getByIdsAndOrgId;
  static getByIds = getByIds;
  static getByProvidedId = getByProvidedId;
  static getByOrgIdAndIds = getByOrgIdAndIds;
}
