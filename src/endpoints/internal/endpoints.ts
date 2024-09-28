import {kEndpointTag} from '../types.js';
import {
  getUsersEndpointDefinition,
  getWaitlistedUsersEndpointDefinition,
  getWorkspacesEndpointDefinition,
  upgradeWaitlistedUsersEndpointDefinition,
} from './endpoint.mddoc.js';
import getUsers from './getUsers/handler.js';
import getWaitlistedUsers from './getWaitlistedUsers/handler.js';
import getWorkspaces from './getWorkspaces/handler.js';
import {InternalsExportedEndpoints} from './types.js';
import upgradeWaitlistedUsers from './upgradeWaitlistedUsers/handler.js';

export function getInternalsHttpEndpoints() {
  const internalsExportedEndpoints: InternalsExportedEndpoints = {
    getWaitlistedUsers: {
      tag: [kEndpointTag.private],
      fn: getWaitlistedUsers,
      mddocHttpDefinition: getWaitlistedUsersEndpointDefinition,
    },
    upgradeWaitlistedUsers: {
      tag: [kEndpointTag.private],
      fn: upgradeWaitlistedUsers,
      mddocHttpDefinition: upgradeWaitlistedUsersEndpointDefinition,
    },
    getUsers: {
      tag: [kEndpointTag.private],
      fn: getUsers,
      mddocHttpDefinition: getUsersEndpointDefinition,
    },
    getWorkspaces: {
      tag: [kEndpointTag.private],
      fn: getWorkspaces,
      mddocHttpDefinition: getWorkspacesEndpointDefinition,
    },
  };
  return internalsExportedEndpoints;
}
