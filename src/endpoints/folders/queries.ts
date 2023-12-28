import {Folder} from '../../definitions/folder';
import {FolderQuery} from '../contexts/data/types';
import {getStringListQuery} from '../contexts/semantic/utils';

function getByNamepath(folder: Pick<Folder, 'workspaceId' | 'namepath'>): FolderQuery {
  const {namepath, workspaceId} = folder;
  return {
    workspaceId,
    namepath: {$all: namepath, $size: namepath.length},
  };
}

function getByAncestor(
  folder: Pick<Folder, 'workspaceId' | 'namepath'>
): Pick<FolderQuery, 'workspaceId' | 'namepath'> {
  const {namepath, workspaceId} = folder;
  return {
    workspaceId,
    ...getStringListQuery<Folder>(
      namepath,
      /** prefix */ 'namepath',
      /** matcher op */ '$eq',
      /** include size */ false
    ),
  };
}

function getByParent(
  folder: Pick<Folder, 'workspaceId' | 'resourceId'>
): Pick<FolderQuery, 'workspaceId' | 'parentId'> {
  const {resourceId, workspaceId} = folder;
  return {workspaceId, parentId: resourceId};
}

export abstract class FolderQueries {
  static getByNamepath = getByNamepath;
  static getByAncestor = getByAncestor;
  static getByParent = getByParent;
}
