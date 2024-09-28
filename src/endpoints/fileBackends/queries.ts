import {isString} from 'lodash-es';
import {ResolvedMountEntryQuery} from '../../contexts/data/types.js';
import {
  getIgnoreCaseDataQueryRegExp,
  getStringListQuery,
} from '../../contexts/semantic/utils.js';
import {ResolvedMountEntry} from '../../definitions/fileBackend.js';

function getByFimidaraNamepath(
  entry: Pick<
    ResolvedMountEntry,
    'workspaceId' | 'fimidaraNamepath' | 'fimidaraExt'
  >
): Pick<
  ResolvedMountEntryQuery,
  'fimidaraExt' | 'workspaceId' | 'fimidaraNamepath'
> {
  const {fimidaraExt, fimidaraNamepath, workspaceId} = entry;
  return {
    workspaceId,
    fimidaraExt: isString(fimidaraExt)
      ? getIgnoreCaseDataQueryRegExp(fimidaraExt)
      : undefined,
    ...getStringListQuery<ResolvedMountEntry>(
      fimidaraNamepath,
      /** prefix */ 'fimidaraNamepath',
      /** matcher op */ '$regex',
      /** include size */ true
    ),
  };
}

function getByBackendNamepath(
  entry: Pick<
    ResolvedMountEntry,
    'workspaceId' | 'backendNamepath' | 'backendExt'
  >
): Pick<
  ResolvedMountEntryQuery,
  'backendExt' | 'workspaceId' | 'backendNamepath'
> {
  const {backendExt, backendNamepath, workspaceId} = entry;
  return {
    workspaceId,
    backendExt: isString(backendExt)
      ? getIgnoreCaseDataQueryRegExp(backendExt)
      : undefined,
    ...getStringListQuery<ResolvedMountEntry>(
      backendNamepath,
      /** prefix */ 'backendNamepath',
      /** matcher op */ '$regex',
      /** include size */ true
    ),
  };
}
function getByParentBackendPath(
  entry: Pick<ResolvedMountEntry, 'workspaceId' | 'backendNamepath'>
): Pick<ResolvedMountEntryQuery, 'workspaceId' | 'backendNamepath'> {
  const {backendNamepath, workspaceId} = entry;
  return {
    workspaceId,
    ...getStringListQuery<ResolvedMountEntry>(
      backendNamepath,
      /** prefix */ 'backendNamepath',
      /** matcher op */ '$regex',
      /** include size */ false
    ),
    backendNamepath: {$size: backendNamepath.length + 1},
  };
}

export abstract class FileBackendQueries {
  static getByFimidaraNamepath = getByFimidaraNamepath;
  static getByBackendNamepath = getByBackendNamepath;
  static getByParentBackendPath = getByParentBackendPath;
}
