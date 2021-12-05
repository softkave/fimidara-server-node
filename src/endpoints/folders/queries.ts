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
  const filter = newFilter().addItem(
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

// This returns all the folders that have the name path and possibly more
function getFoldersWithNamePath(organizationId: string, path: string[]) {
  const filter = newFilter().addItem(
    'organizationId',
    organizationId,
    DataProviderFilterValueOperator.Equal
  );

  path.forEach((item, index) =>
    filter.addItem(
      `namePath.${index}`,
      item,
      DataProviderFilterValueOperator.Equal
    )
  );

  return filter.build();
}

// This returns folders with the exact name path
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
  static getFoldersByParentId = getFoldersByParentId;
  static getByNamePath = getByNamePath;
  static folderExistsByNamePath = folderExistsByNamePath;
  static getFoldersWithNamePath = getFoldersWithNamePath;
}
