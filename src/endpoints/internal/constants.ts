import {endpointConstants} from '../constants';

export const internalConstants = {
  maxUpgradeWaitlistedUserItems: 1000,
  routes: {
    getWaitlistedUsers: `${endpointConstants.apiv1}/internals/getWaitlistedUsers`,
    upgradeWaitlistedUsers: `${endpointConstants.apiv1}/internals/upgradeWaitlistedUsers`,
    getUsers: `${endpointConstants.apiv1}/internals/getUsers`,
    getWorkspaces: `${endpointConstants.apiv1}/internals/getWorkspaces`,
  },
};
