import {getResourcesEndpointDefinition} from './endpoints.mddoc';
import getResources from './getResources/handler';
import {ResourcesExportedEndpoints} from './types';

export function getResourcesPublicHttpEndpoints() {
  const resourcesExportedEndpoints: ResourcesExportedEndpoints = {
    getResources: {
      fn: getResources,
      mddocHttpDefinition: getResourcesEndpointDefinition,
    },
  };
  return resourcesExportedEndpoints;
}
