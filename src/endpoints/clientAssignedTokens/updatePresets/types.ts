import {IBaseContext} from '../../contexts/BaseContext';
import {IPresetInput} from '../../presetPermissionsGroups/types';
import {Endpoint} from '../../types';
import {IPublicClientAssignedToken} from '../types';

export interface IUpdateClientAssignedTokenPresetsParams {
  tokenId?: string;
  onReferenced?: boolean;
  providedResourceId?: string;
  organizationId?: string;
  presets: IPresetInput[];
}

export interface IUpdateClientAssignedTokenPresetsResult {
  token: IPublicClientAssignedToken;
}

export type UpdateClientAssignedTokenPresetsEndpoint = Endpoint<
  IBaseContext,
  IUpdateClientAssignedTokenPresetsParams,
  IUpdateClientAssignedTokenPresetsResult
>;
