import {
  getWaitlistedUsersEndpointDefinition,
  upgradeWaitlistedUsersEndpointDefinition,
} from './endpoint.mddoc';
import getWaitlistedUsers from './getWaitlistedUsers/handler';
import {InternalsPrivateExportedEndpoints} from './types';
import upgradeWaitlistedUsers from './upgradeWaitlistedUsers/handler';

export function getInternalsPrivateHttpEndpoints() {
  const internalsExportedEndpoints: InternalsPrivateExportedEndpoints = {
    getWaitlistedUsers: {
      fn: getWaitlistedUsers,
      mddocHttpDefinition: getWaitlistedUsersEndpointDefinition,
    },
    upgradeWaitlistedUsers: {
      fn: upgradeWaitlistedUsers,
      mddocHttpDefinition: upgradeWaitlistedUsersEndpointDefinition,
    },
  };
  return internalsExportedEndpoints;
}
