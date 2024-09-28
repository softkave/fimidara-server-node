import {kEndpointTag} from '../types.js';
import addFileBackendConfig from './addConfig/handler.js';
import addFileBackendMountEndpoint from './addMount/handler.js';
import countFileBackendConfigs from './countConfigs/handler.js';
import countFileBackendMounts from './countMounts/handler.js';
import deleteFileBackendConfig from './deleteConfig/handler.js';
import deleteFileBackendMount from './deleteMount/handler.js';
import {
  addFileBackendConfigEndpointDefinition,
  addFileBackendMountEndpointDefinition,
  countFileBackendConfigsEndpointDefinition,
  countFileBackendMountsEndpointDefinition,
  deleteFileBackendConfigEndpointDefinition,
  deleteFileBackendMountEndpointDefinition,
  getFileBackendConfigEndpointDefinition,
  getFileBackendConfigsEndpointDefinition,
  getFileBackendMountEndpointDefinition,
  getFileBackendMountsEndpointDefinition,
  resolveFileBackendMountsEndpointDefinition,
  updateFileBackendConfigEndpointDefinition,
  updateFileBackendMountEndpointDefinition,
} from './endpoints.mddoc.js';
import getFileBackendConfig from './getConfig/handler.js';
import getFileBackendConfigs from './getConfigs/handler.js';
import getFileBackendMount from './getMount/handler.js';
import getFileBackendMounts from './getMounts/handler.js';
import resolveFileBackendMounts from './resolveMounts/handler.js';
import {FileBackendsExportedEndpoints} from './types.js';
import updateFileBackendConfig from './updateConfig/handler.js';
import updateFileBackendMount from './updateMount/handler.js';

export function getFileBackendsHttpEndpoints() {
  const fileBackendMountsExportedEndpoints: FileBackendsExportedEndpoints = {
    addMount: {
      tag: [kEndpointTag.public],
      fn: addFileBackendMountEndpoint,
      mddocHttpDefinition: addFileBackendMountEndpointDefinition,
    },
    deleteMount: {
      tag: [kEndpointTag.public],
      fn: deleteFileBackendMount,
      mddocHttpDefinition: deleteFileBackendMountEndpointDefinition,
    },
    getMount: {
      tag: [kEndpointTag.public],
      fn: getFileBackendMount,
      mddocHttpDefinition: getFileBackendMountEndpointDefinition,
    },
    getMounts: {
      tag: [kEndpointTag.public],
      fn: getFileBackendMounts,
      mddocHttpDefinition: getFileBackendMountsEndpointDefinition,
    },
    countMounts: {
      tag: [kEndpointTag.public],
      fn: countFileBackendMounts,
      mddocHttpDefinition: countFileBackendMountsEndpointDefinition,
    },
    updateMount: {
      tag: [kEndpointTag.public],
      fn: updateFileBackendMount,
      mddocHttpDefinition: updateFileBackendMountEndpointDefinition,
    },
    resolveMounts: {
      tag: [kEndpointTag.public],
      fn: resolveFileBackendMounts,
      mddocHttpDefinition: resolveFileBackendMountsEndpointDefinition,
    },

    addConfig: {
      tag: [kEndpointTag.public],
      fn: addFileBackendConfig,
      mddocHttpDefinition: addFileBackendConfigEndpointDefinition,
    },
    deleteConfig: {
      tag: [kEndpointTag.public],
      fn: deleteFileBackendConfig,
      mddocHttpDefinition: deleteFileBackendConfigEndpointDefinition,
    },
    getConfig: {
      tag: [kEndpointTag.public],
      fn: getFileBackendConfig,
      mddocHttpDefinition: getFileBackendConfigEndpointDefinition,
    },
    getConfigs: {
      tag: [kEndpointTag.public],
      fn: getFileBackendConfigs,
      mddocHttpDefinition: getFileBackendConfigsEndpointDefinition,
    },
    countConfigs: {
      tag: [kEndpointTag.public],
      fn: countFileBackendConfigs,
      mddocHttpDefinition: countFileBackendConfigsEndpointDefinition,
    },
    updateConfig: {
      tag: [kEndpointTag.public],
      fn: updateFileBackendConfig,
      mddocHttpDefinition: updateFileBackendConfigEndpointDefinition,
    },
  };
  return fileBackendMountsExportedEndpoints;
}
