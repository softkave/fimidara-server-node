import {
  getUsersEndpointDefinition,
  getWaitlistedUsersEndpointDefinition,
  getWorkspacesEndpointDefinition,
  upgradeWaitlistedUsersEndpointDefinition,
} from './endpoint.mddoc.js';
import getUsers from './getUsers/handler.js';
import getWaitlistedUsers from './getWaitlistedUsers/handler.js';
import getWorkspaces from './getWorkspaces/handler.js';
import {InternalsPrivateExportedEndpoints} from './types.js';
import upgradeWaitlistedUsers from './upgradeWaitlistedUsers/handler.js';

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
