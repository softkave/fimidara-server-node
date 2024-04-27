import {isString} from 'lodash';
import {File} from '../../definitions/file';
import {Folder} from '../../definitions/folder';
import {FileQuery} from '../contexts/data/types';
import {
  getIgnoreCaseDataQueryRegExp,
  getStringListQuery,
} from '../contexts/semantic/utils';

function getByNamepath(
  file: Pick<File, 'workspaceId' | 'namepath' | 'ext'>
): Pick<FileQuery, 'ext' | 'workspaceId' | 'namepath'> {
  const {ext, namepath, workspaceId} = file;
  return {
    workspaceId,
    ext: isString(ext) ? getIgnoreCaseDataQueryRegExp(ext) : undefined,
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
