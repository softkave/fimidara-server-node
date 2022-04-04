import {IPublicPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

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
