import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface UpgradeWaitlistedUsersEndpointParams {
  userIds: string[];
}

export type UpgradeWaitlistedUsersEndpoint = Endpoint<
  BaseContextType,
  UpgradeWaitlistedUsersEndpointParams
>;
