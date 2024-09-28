import {FileQuery} from '../../contexts/data/types.js';
import {
  getIgnoreCaseDataQueryRegExp,
  getStringListQuery,
} from '../../contexts/semantic/utils.js';
import {File} from '../../definitions/file.js';
import {Folder} from '../../definitions/folder.js';

function getByNamepath(
  file: Pick<File, 'workspaceId' | 'namepath' | 'ext'>
): Pick<FileQuery, 'ext' | 'workspaceId' | 'namepath'> {
  const {ext, namepath, workspaceId} = file;
  return {
    workspaceId,
    ext: ext ? getIgnoreCaseDataQueryRegExp(ext) : undefined,
    ...getStringListQuery<Folder>(
      namepath,
      /** prefix */ 'namepath',
      /** matcher op */ '$regex',
      /** include size */ true
    ),
  };
}

export abstract class FileQueries {
  static getByNamepath = getByNamepath;
}
