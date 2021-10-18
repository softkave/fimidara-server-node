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

function getByNamePath(namePath: string[], isPartial?: boolean) {
  const name = namePath[namePath.length - 1];
  const filter = newFilter().addItem(
    'name',
    name,
    DataProviderFilterValueOperator.Regex
  );

  if (isPartial) {
    namePath.forEach((name, i) => {
      filter.addItem(
        `namePath.${i}`,
        name,
        DataProviderFilterValueOperator.Equal
      );
    });
  } else {
    filter.addItem('namePath', namePath, DataProviderFilterValueOperator.Equal);
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

function getFoldersByParentId(parentId: string) {
  return newFilter()
    .addItem('parentId', parentId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getFoldersByParentNamePath(parentPath: string[]) {
  return newFilter()
    .addItem('namePath', parentPath, DataProviderFilterValueOperator.Equal)
    .build();
}

function getImmediateFoldersByBucketId(bucketId: string) {
  return newFilter()
    .addItem('bucketId', bucketId, DataProviderFilterValueOperator.Equal)
    .addItem('namePath', [], DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class FileQueries {
  static getById = getById;
  static folderExists = folderExists;
  static getByNamePath = getByNamePath;
  static getFoldersByParentId = getFoldersByParentId;
  static getFoldersByParentNamePath = getFoldersByParentNamePath;
  static getImmediateFoldersByBucketId = getImmediateFoldersByBucketId;
}
