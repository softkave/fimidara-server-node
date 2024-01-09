import {File} from '../../definitions/file';
import {FileQuery} from '../contexts/data/types';

function getByNamepath(
  file: Pick<File, 'workspaceId' | 'namepath' | 'extension'>
): Pick<FileQuery, 'extension' | 'workspaceId' | 'namepath'> {
  const {extension, namepath, workspaceId} = file;
  return {
    extension,
    workspaceId,
    // MongoDB array queries with `{$all: [], $size: 0}` do not work, so using
    // `{$eq: []}` instead, since that works
    namepath:
      namepath.length === 0 ? {$eq: []} : {$all: namepath, $size: namepath.length},
  };
}

export abstract class FileQueries {
  static getByNamepath = getByNamepath;
}
