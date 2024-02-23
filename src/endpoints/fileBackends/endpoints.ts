import addFileBackendConfig from './addConfig/handler';
import addFileBackendMountEndpoint from './addMount/handler';
import countFileBackendConfigs from './countConfigs/handler';
import countFileBackendMounts from './countMounts/handler';
import deleteFileBackendConfig from './deleteConfig/handler';
import deleteFileBackendMount from './deleteMount/handler';
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
} from './endpoints.mddoc';
import getFileBackendConfig from './getConfig/handler';
import getFileBackendConfigs from './getConfigs/handler';
import getFileBackendMount from './getMount/handler';
import getFileBackendMounts from './getMounts/handler';
import resolveFileBackendMounts from './resolveMounts/handler';
import {FileBackendsExportedEndpoints} from './types';
import updateFileBackendConfig from './updateConfig/handler';
import updateFileBackendMount from './updateMount/handler';

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
