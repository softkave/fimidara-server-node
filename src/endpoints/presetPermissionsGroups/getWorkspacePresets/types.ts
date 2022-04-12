import {IPublicPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetWorkspacePresetPermissionsGroupsEndpointParams {
  workspaceId: string;
}

export interface IGetWorkspacePresetPermissionsGroupsEndpointResult {
  presets: IPublicPresetPermissionsGroup[];
}

export type GetWorkspacePresetPermissionsGroupsEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspacePresetPermissionsGroupsEndpointParams,
  IGetWorkspacePresetPermissionsGroupsEndpointResult
>;
