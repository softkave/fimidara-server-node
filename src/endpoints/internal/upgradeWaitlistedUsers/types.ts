import {Endpoint} from '../../types';

export interface UpgradeWaitlistedUsersEndpointParams {
  userIds: string[];
}

export type UpgradeWaitlistedUsersEndpoint =
  Endpoint<UpgradeWaitlistedUsersEndpointParams>;
