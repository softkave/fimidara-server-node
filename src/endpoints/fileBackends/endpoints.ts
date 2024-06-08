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

export function getFileBackendsPublicHttpEndpoints() {
  const fileBackendMountsExportedEndpoints: FileBackendsExportedEndpoints = {
    addMount: {
      fn: addFileBackendMountEndpoint,
      mddocHttpDefinition: addFileBackendMountEndpointDefinition,
    },
    deleteMount: {
      fn: deleteFileBackendMount,
      mddocHttpDefinition: deleteFileBackendMountEndpointDefinition,
    },
    getMount: {
      fn: getFileBackendMount,
      mddocHttpDefinition: getFileBackendMountEndpointDefinition,
    },
    getMounts: {
      fn: getFileBackendMounts,
      mddocHttpDefinition: getFileBackendMountsEndpointDefinition,
    },
    countMounts: {
      fn: countFileBackendMounts,
      mddocHttpDefinition: countFileBackendMountsEndpointDefinition,
    },
    updateMount: {
      fn: updateFileBackendMount,
      mddocHttpDefinition: updateFileBackendMountEndpointDefinition,
    },
    resolveMounts: {
      fn: resolveFileBackendMounts,
      mddocHttpDefinition: resolveFileBackendMountsEndpointDefinition,
    },

    addConfig: {
      fn: addFileBackendConfig,
      mddocHttpDefinition: addFileBackendConfigEndpointDefinition,
    },
    deleteConfig: {
      fn: deleteFileBackendConfig,
      mddocHttpDefinition: deleteFileBackendConfigEndpointDefinition,
    },
    getConfig: {
      fn: getFileBackendConfig,
      mddocHttpDefinition: getFileBackendConfigEndpointDefinition,
    },
    getConfigs: {
      fn: getFileBackendConfigs,
      mddocHttpDefinition: getFileBackendConfigsEndpointDefinition,
    },
    countConfigs: {
      fn: countFileBackendConfigs,
      mddocHttpDefinition: countFileBackendConfigsEndpointDefinition,
    },
    updateConfig: {
      fn: updateFileBackendConfig,
      mddocHttpDefinition: updateFileBackendConfigEndpointDefinition,
    },
  };
  return fileBackendMountsExportedEndpoints;
}
