import {FileBackendMountQuery} from '../../contexts/data/types.js';
import {FileBackendMount} from '../../definitions/fileBackend.js';

function getBySignature(
  data: Pick<
    FileBackendMount,
    'namepath' | 'mountedFrom' | 'backend' | 'workspaceId'
  >
): FileBackendMountQuery {
  return {
    workspaceId: data.workspaceId,
    backend: data.backend,
    namepath: data.namepath.length
      ? {$all: data.namepath, $size: data.namepath.length}
      : {$eq: data.namepath},
    mountedFrom: data.mountedFrom.length
      ? {$all: data.mountedFrom, $size: data.mountedFrom.length}
      : {$eq: data.mountedFrom},
  };
}

export abstract class FileMountQueries {
  static getBySignature = getBySignature;
}
