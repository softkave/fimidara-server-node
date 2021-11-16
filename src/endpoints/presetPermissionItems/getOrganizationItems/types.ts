import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPresetPermissionsItem} from '../types';

export interface IGetOrganizationPresetPermissionsItemEndpointParams {
  organizationId: string;
}

export interface IGetOrganizationPresetPermissionsItemEndpointResult {
  items: IPublicPresetPermissionsItem[];
}

export type GetOrganizationPresetPermissionsItemEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationPresetPermissionsItemEndpointParams,
  IGetOrganizationPresetPermissionsItemEndpointResult
>;
