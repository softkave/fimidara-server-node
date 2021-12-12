import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPresetPermissionsGroup} from '../types';

export interface IGetOrganizationPresetPermissionsGroupsEndpointParams {
  organizationId: string;
}

export interface IGetOrganizationPresetPermissionsGroupsEndpointResult {
  presets: IPublicPresetPermissionsGroup[];
}

export type GetOrganizationPresetPermissionsGroupsEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationPresetPermissionsGroupsEndpointParams,
  IGetOrganizationPresetPermissionsGroupsEndpointResult
>;
