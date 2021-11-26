import {IFolder} from '../../definitions/folder';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IFolder>();
}

function getById(id: string) {
  return newFilter()
    .addItem('folderId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByName(name: string, parent?: IFolder) {
  const filter: DataProviderFilterBuilder<IFolder> = newFilter().addItem(
    'name',
    name,
    DataProviderFilterValueOperator.Equal
  );

  if (parent) {
    filter.addItem(
      'parentId',
      parent.folderId,
      DataProviderFilterValueOperator.Equal
    );
  } else {
    filter.addItem('parentId', null, DataProviderFilterValueOperator.Equal);
  }

  return filter.build();
}

function folderExists(
  bucketId: string,
  parentId: string | null | undefined,
  name: string
) {
  return newFilter()
    .addItem('bucketId', bucketId, DataProviderFilterValueOperator.Equal)
    .addItem('parentId', parentId, DataProviderFilterValueOperator.Equal)
    .addItem('name', name, DataProviderFilterValueOperator.Equal)
    .build();
}

function folderExistsByNamePath(organizationId: string, namePath: string[]) {
  return newFilter()
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem('namePath', namePath, DataProviderFilterValueOperator.Equal)
    .build();
}

function getFoldersByParentId(parentId: string) {
  return newFilter()
    .addItem('parentId', parentId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getFoldersByBucketId(bucketId: string) {
  return newFilter()
    .addItem('bucketId', bucketId, DataProviderFilterValueOperator.Equal)
    .addItem('parentId', null, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByNamePath(organizationId: string, namePath: string[]) {
  return newFilter()
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem('namePath', namePath, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class FolderQueries {
  static getById = getById;
  static getByName = getByName;
  static folderExists = folderExists;
  static getFoldersByParentId = getFoldersByParentId;
  static getFoldersByBucketId = getFoldersByBucketId;
  static getByNamePath = getByNamePath;
  static folderExistsByNamePath = folderExistsByNamePath;
}
