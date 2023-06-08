import {endpointConstants} from '../constants';

export const internalConstants = {
  maxUpgradeWaitlistedUserItems: 1000,
  routes: {
    getWaitlistedUsers: `${endpointConstants.apiv1}/internals/getWaitlistedUsers`,
    upgradeWaitlistedUsers: `${endpointConstants.apiv1}/internals/upgradeWaitlistedUsers`,
  },
};
