import {IFile} from '../../definitions/file';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IFile>();
}

function getByNameAndFolderId(name: string, folderId: string) {
  return newFilter()
    .addItem('name', name, DataProviderFilterValueOperator.Equal)
    .addItem('folderId', folderId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getFilesByParentId(workspaceId: string, parentId: string | null, idList?: string[]) {
  const q = newFilter()
    .addItem('folderId', parentId, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal);
  if (idList) {
    q.addItem('resourceId', idList, DataProviderFilterValueOperator.In);
  }

  return q.build();
}

function getByNamePath(workspaceId: string, namePath: string[]) {
  return newFilter()
    .addItem('namePath', namePath, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByNamePathAndExtention(workspaceId: string, namePath: string[], extension: string) {
  return newFilter()
    .addItem('namePath', namePath, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('extension', extension, DataProviderFilterValueOperator.Equal)
    .build();
}

function getRootFiles(workspaceId: string) {
  return newFilter()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('folderId', null, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class FileQueries {
  static getFilesByParentId = getFilesByParentId;
  static getByNameAndFolderId = getByNameAndFolderId;
  static getByNamePath = getByNamePath;
  static getRootFiles = getRootFiles;
  static getByNamePathAndExtention = getByNamePathAndExtention;
}
