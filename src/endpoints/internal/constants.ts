import {kEndpointConstants} from '../constants.js';

export const internalConstants = {
  maxUpgradeWaitlistedUserItems: 1000,
  routes: {
    getWaitlistedUsers: `${kEndpointConstants.apiv1}/internals/getWaitlistedUsers`,
    upgradeWaitlistedUsers: `${kEndpointConstants.apiv1}/internals/upgradeWaitlistedUsers`,
    getUsers: `${kEndpointConstants.apiv1}/internals/getUsers`,
    getWorkspaces: `${kEndpointConstants.apiv1}/internals/getWorkspaces`,
  },
};
