import {DataProviderFilterValueOperator} from './contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from './contexts/data-providers/DataProviderFilterBuilder';

function getByWorkspaceId(id: string) {
  return new DataProviderFilterBuilder<{workspaceId: string}>()
    .addItem('workspaceId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByWorkspaceAndName(workspaceId: string, name: string) {
  return new DataProviderFilterBuilder<{workspaceId: string; name: string}>()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
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

function getByIdsAndWorkspaceId(ids: string[], workspaceId: string) {
  return new DataProviderFilterBuilder<{
    resourceId: string;
    workspaceId: string;
  }>()
    .addItem('resourceId', ids, DataProviderFilterValueOperator.In)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByIds(ids: string[]) {
  return new DataProviderFilterBuilder<{
    resourceId: string;
  }>()
    .addItem('resourceId', ids, DataProviderFilterValueOperator.In)
    .build();
}

function getByWorkspaceIdAndIds(workspaceId: string, ids: string[]) {
  return new DataProviderFilterBuilder<{
    resourceId: string;
    workspaceId: string;
  }>()
    .addItem('resourceId', ids, DataProviderFilterValueOperator.In)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByProvidedId(workspaceId: string, id: string) {
  return new DataProviderFilterBuilder<{
    providedResourceId: string;
    workspaceId: string;
  }>()
    .addItem('providedResourceId', id, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class EndpointReusableQueries {
  static getByWorkspaceId = getByWorkspaceId;
  static getByWorkspaceAndName = getByWorkspaceAndName;
  static getById = getById;
  static getByIdsAndWorkspaceId = getByIdsAndWorkspaceId;
  static getByIds = getByIds;
  static getByProvidedId = getByProvidedId;
  static getByWorkspaceIdAndIds = getByWorkspaceIdAndIds;
}
