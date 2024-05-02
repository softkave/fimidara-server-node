import {getResourcesEndpointDefinition} from './endpoints.mddoc.js';
import getResources from './getResources/handler.js';
import {ResourcesExportedEndpoints} from './types.js';

export function getResourcesPublicHttpEndpoints() {
  const resourcesExportedEndpoints: ResourcesExportedEndpoints = {
    getResources: {
      fn: getResources,
      mddocHttpDefinition: getResourcesEndpointDefinition,
    },
  };
  return resourcesExportedEndpoints;
}
