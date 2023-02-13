import {IFolder} from '../../definitions/folder';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IFolder>();
}

function getByName(name: string, parent?: IFolder) {
  const filter = newFilter().addItem('name', name, DataProviderFilterValueOperator.Equal);

  if (parent) {
    filter.addItem('parentId', parent.resourceId, DataProviderFilterValueOperator.Equal);
  } else {
    filter.addItem('parentId', null, DataProviderFilterValueOperator.Equal);
  }

  return filter.build();
}

function folderExistsByNamePath(workspaceId: string, namePath: string[]) {
  return newFilter()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('namePath', namePath, DataProviderFilterValueOperator.Equal)
    .build();
}

function getFoldersByParentId(
  workspaceId: string,
  parentId: string | null,
  includeIdList?: string[],
  excludeIdList?: string[]
) {
  const q = newFilter()
    .addItem('parentId', parentId, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal);
  if (includeIdList) {
    q.addItem('resourceId', includeIdList, DataProviderFilterValueOperator.In);
  }
  if (excludeIdList) {
    q.addItem('resourceId', excludeIdList, DataProviderFilterValueOperator.NotIn);
  }

  return q.build();
}

// This returns all the folders that have the name path and possibly more
function getFoldersWithNamePath(workspaceId: string, path: string[]) {
  const filter = newFilter().addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal);

  path.forEach((item, index) =>
    filter.addItemWithStringKey(`namePath.${index}`, item, DataProviderFilterValueOperator.Equal)
  );

  return filter.build();
}

// This returns folders with the exact name path
function getByNamePath(workspaceId: string, namePath: string[]) {
  return newFilter()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('namePath', namePath, DataProviderFilterValueOperator.Equal)
    .build();
}

function getRootFolders(workspaceId: string) {
  return newFilter()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('parentId', null, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class FolderQueries {
  static getByName = getByName;
  static getByParentId = getFoldersByParentId;
  static getByNamePath = getByNamePath;
  static folderExistsByNamePath = folderExistsByNamePath;
  static getFoldersWithNamePath = getFoldersWithNamePath;
  static getRootFolders = getRootFolders;
}
