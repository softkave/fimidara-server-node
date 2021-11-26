import {IFile} from '../../definitions/file';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IFile>();
}

function getById(id: string) {
  return newFilter()
    .addItem('fileId', id, DataProviderFilterValueOperator.Equal)
    .build();
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

function getByNamePath(namePath: string[]) {
  return newFilter()
    .addItem('namePath', namePath, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class FileQueries {
  static getById = getById;
  static getFilesByParentId = getFilesByParentId;
  static getByNameAndFolderId = getByNameAndFolderId;
  static getByNamePath = getByNamePath;
}
