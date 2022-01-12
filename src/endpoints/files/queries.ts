import {IFile} from '../../definitions/file';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<IFile>();
}

function getByNameAndFolderId(name: string, folderId: string) {
  return newFilter()
    .addItem('name', name, DataProviderFilterValueOperator.Equal)
    .addItem('folderId', folderId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getFilesByParentId(parentId: string) {
  return newFilter()
    .addItem('folderId', parentId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByNamePath(organizationId: string, namePath: string[]) {
  return newFilter()
    .addItem('namePath', namePath, DataProviderFilterValueOperator.Equal)
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

function getRootFiles(organizationId: string) {
  return newFilter()
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem('folderId', null, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class FileQueries {
  static getById = EndpointReusableQueries.getById;
  static getFilesByParentId = getFilesByParentId;
  static getByNameAndFolderId = getByNameAndFolderId;
  static getByNamePath = getByNamePath;
  static getRootFiles = getRootFiles;
  static getByMultipleIds = EndpointReusableQueries.getByIdsAndOrgId;
}
