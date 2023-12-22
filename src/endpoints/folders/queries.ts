import {Folder} from '../../definitions/folder';
import {FolderQuery} from '../contexts/data/types';

function getByNamepath(folder: Pick<Folder, 'workspaceId' | 'namepath'>): FolderQuery {
  const {namepath, workspaceId} = folder;
  return {
    workspaceId,
    namepath: {$all: namepath, $size: namepath.length},
  };
}

export abstract class FolderQueries {
  static getByNamepath = getByNamepath;
}
