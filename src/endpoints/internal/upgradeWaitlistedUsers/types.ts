import {Endpoint} from '../../types.js';

export interface UpgradeWaitlistedUsersEndpointParams {
  userIds: string[];
}

export type UpgradeWaitlistedUsersEndpoint =
  Endpoint<UpgradeWaitlistedUsersEndpointParams>;
