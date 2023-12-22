import {File} from '../../definitions/file';
import {FileQuery} from '../contexts/data/types';

function getByNamepath(
  file: Pick<File, 'workspaceId' | 'namepath' | 'extension'>
): FileQuery {
  const {extension, namepath, workspaceId} = file;
  return {
    extension,
    workspaceId,
    namepath: {$all: namepath, $size: namepath.length},
  };
}

export abstract class FileQueries {
  static getByNamepath = getByNamepath;
}
