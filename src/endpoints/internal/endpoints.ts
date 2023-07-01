import {
  getUsersEndpointDefinition,
  getWaitlistedUsersEndpointDefinition,
  getWorkspacesEndpointDefinition,
  upgradeWaitlistedUsersEndpointDefinition,
} from './endpoint.mddoc';
import getUsers from './getUsers/handler';
import getWaitlistedUsers from './getWaitlistedUsers/handler';
import getWorkspaces from './getWorkspaces/handler';
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
    getUsers: {
      fn: getUsers,
      mddocHttpDefinition: getUsersEndpointDefinition,
    },
    getWorkspaces: {
      fn: getWorkspaces,
      mddocHttpDefinition: getWorkspacesEndpointDefinition,
    },
  };
  return internalsExportedEndpoints;
}
