import {Folder} from '../../definitions/folder';
import {DataProviderFilterValueOperator} from '../contexts/data/DataProvider';
import DataProviderFilterBuilder from '../contexts/data/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<Folder>();
}

function getByName(name: string, parent?: Folder) {
  const filter = newFilter().addItem('name', name, DataProviderFilterValueOperator.Equal);
  if (parent) {
    filter.addItem('parentId', parent.resourceId, DataProviderFilterValueOperator.Equal);
  } else {
    filter.addItem('parentId', null, DataProviderFilterValueOperator.Equal);
  }

  return filter.build();
}

function folderExistsBynamepath(workspaceId: string, namepath: string[]) {
  return newFilter()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('namepath', namepath, DataProviderFilterValueOperator.Equal)
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

// This returns folders with the exact name path
function getBynamepath(workspaceId: string, namepath: string[]) {
  return newFilter()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('namepath', namepath, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByAncestor(workspaceId: string, parentId: string) {
  return newFilter()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('idPath', parentId, DataProviderFilterValueOperator.Equal)
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
  static getBynamepath = getBynamepath;
  static folderExistsBynamepath = folderExistsBynamepath;
  static getRootContent = getRootFolders;
  static getByAncestor = getByAncestor;
}
