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

function logicKey(name: string) {
  return `logic_${name}`;
}

export const kInjectionKeys = {
  logic: {
    permissions: logicKey('permissions'),
    jobs: logicKey('jobs'),
  },
  data: {
    user: dataKey('user'),
    file: dataKey('file'),
    folder: dataKey('folder'),
    workspace: dataKey('workspace'),
    fileBackendConfig: dataKey('fileBackendConfig'),
    fileBackendMount: dataKey('fileBackendMount'),
    filePresignedPath: dataKey('filePresignedPath'),
    permissions: dataKey('permissions'),
    permissionGroup: dataKey('permissionGroup'),
    permissionItem: dataKey('permissionItem'),
    assignedItem: dataKey('assignedItem'),
    tag: dataKey('tag'),
    job: dataKey('job'),
    resolvedMountEntry: dataKey('resolvedMountEntry'),
    utils: dataKey('utils'),
  },
  semantic: {
    user: semanticKey('user'),
    file: semanticKey('file'),
    folder: semanticKey('folder'),
    workspace: semanticKey('workspace'),
    fileBackendConfig: semanticKey('fileBackendConfig'),
    fileBackendMount: semanticKey('fileBackendMount'),
    filePresignedPath: semanticKey('filePresignedPath'),
    permissions: semanticKey('permissions'),
    permissionGroup: semanticKey('permissionGroup'),
    permissionItem: semanticKey('permissionItem'),
    assignedItem: semanticKey('assignedItem'),
    tag: semanticKey('tag'),
    job: semanticKey('job'),
    collaborationRequest: semanticKey('collaborationRequest'),
    usageRecord: semanticKey('usageRecord'),
    resolvedMountEntry: semanticKey('resolvedMountEntry'),
    utils: semanticKey('utils'),
  },
  filePersistence: {
    [FilePersistenceProviderTypeMap.Fs]: filePersistenceKey(
      FilePersistenceProviderTypeMap.Fs
    ),
  },
  encryption: 'encryption',
  config: 'config',
  secretsManager: 'secretsManager',
  fileProviderResolver: 'fileProviderResolver',
  asyncLocalStorage: 'asyncLocalStorage',
  session: 'session',
};
