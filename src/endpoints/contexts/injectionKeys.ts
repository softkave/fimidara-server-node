import {FilePersistenceProviderTypeMap} from '../../definitions/file';

function dataKey(name: string) {
  return `data_${name}`;
}

function semanticKey(name: string) {
  return `semantic_${name}`;
}

function filePersistenceKey(name: string) {
  return `filePersistence_${name}`;
}

function fileBackendKey(name: string) {
  return `fileBackend_${name}`;
}

function logicKey(name: string) {
  return `logic_${name}`;
}

export const kInjectionKeys = {
  logic: {
    permissions: logicKey('permissions'),
    jobs: logicKey('jobs'),
  },
  data: {
    file: dataKey('file'),
    workspace: dataKey('workspace'),
    fileBackend: dataKey('fileBackend'),
  },
  semantic: {
    file: semanticKey('file'),
    folder: semanticKey('folder'),
    workspace: semanticKey('workspace'),
    fileBackendConfig: semanticKey('fileBackendConfig'),
    fileBackendMount: semanticKey('fileBackendMount'),
    permissions: semanticKey('permissions'),
    jobs: semanticKey('jobs'),
    utils: semanticKey('utils'),
  },
  filePersistence: {
    [FilePersistenceProviderTypeMap.Fs]: filePersistenceKey(
      FilePersistenceProviderTypeMap.Fs
    ),
  },
  encryption: 'encryption',
  config: 'config',
};
