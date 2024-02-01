import {isString} from 'lodash';
import {File} from '../../definitions/file';
import {Folder} from '../../definitions/folder';
import {getIgnoreCaseRegExpForString} from '../../utils/fns';
import {FileQuery} from '../contexts/data/types';
import {getStringListQuery} from '../contexts/semantic/utils';

function getByNamepath(
  file: Pick<File, 'workspaceId' | 'namepath' | 'extension'>
): Pick<FileQuery, 'extension' | 'workspaceId' | 'namepath'> {
  const {extension, namepath, workspaceId} = file;
  return {
    workspaceId,
    extension: isString(extension)
      ? {$regex: getIgnoreCaseRegExpForString(extension)}
      : undefined,
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
