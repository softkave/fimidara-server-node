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

function getByNameAndBUcketId(name: string, bucketId: string) {
  return newFilter()
    .addItem('name', name, DataProviderFilterValueOperator.Equal)
    .addItem('bucketId', bucketId, DataProviderFilterValueOperator.Equal)
    .build();
}

function folderExists(
  bucketId: string,
  parentId: string | null | undefined,
  name: string
) {
  return newFilter()
    .addItem('bucketId', bucketId, DataProviderFilterValueOperator.Equal)
    .addItem('folderId', parentId, DataProviderFilterValueOperator.Equal)
    .addItem('name', name, DataProviderFilterValueOperator.Equal)
    .build();
}

function getFilesByParentId(parentId: string) {
  return newFilter()
    .addItem('folderId', parentId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getFilesByBucketId(bucketId: string) {
  return newFilter()
    .addItem('bucketId', bucketId, DataProviderFilterValueOperator.Equal)
    .addItem('folderId', null, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class FileQueries {
  static getById = getById;
  static folderExists = folderExists;
  static getFilesByParentId = getFilesByParentId;
  static getFilesByBucketId = getFilesByBucketId;
  static getByNameAndBUcketId = getByNameAndBUcketId;
  static getByNameAndFolderId = getByNameAndFolderId;
}
