function dataKey(name: string) {
  return `data_${name}`;
}

function semanticKey(name: string) {
  return `semantic_${name}`;
}

function logicKey(name: string) {
  return `logic_${name}`;
}

export const kInjectionKeys = {
  logic: {
    permissions: logicKey('permissions'),
    jobs: logicKey('jobs'),
    usageRecords: logicKey('usageRecords'),
  },
  data: {
    user: dataKey('user'),
    file: dataKey('file'),
    agentToken: dataKey('agentToken'),
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
    appRuntimeState: dataKey('appRuntimeState'),
    collaborationRequest: dataKey('collaborationRequest'),
    usageRecord: dataKey('usageRecord'),
    app: dataKey('app'),
    utils: dataKey('utils'),
  },
  semantic: {
    user: semanticKey('user'),
    file: semanticKey('file'),
    agentToken: semanticKey('agentToken'),
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
    app: semanticKey('app'),
    utils: semanticKey('utils'),
  },
  encryption: 'encryption',
  // config: 'config',
  suppliedConfig: 'suppliedConfig',
  runtimeConfig: 'runtimeConfig',
  secretsManager: 'secretsManager',
  fileProviderResolver: 'fileProviderResolver',
  asyncLocalStorage: 'asyncLocalStorage',
  session: 'session',
  dbConnection: 'dbConnection',
  email: 'email',
  promises: 'promises',
  disposables: 'disposables',
  usageLogic: 'usageLogic',
};
