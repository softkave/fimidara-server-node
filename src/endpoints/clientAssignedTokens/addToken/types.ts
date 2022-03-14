import {IBaseContext} from '../../contexts/BaseContext';
import {IPresetInput} from '../../presetPermissionsGroups/types';
import {Endpoint} from '../../types';
import {IPublicClientAssignedToken} from '../types';

export interface INewClientAssignedTokenInput {
  providedResourceId?: string;
  expires?: number;
  presets?: IPresetInput[];
}

export interface IAddClientAssignedTokenParams {
  organizationId?: string;
  token: INewClientAssignedTokenInput;
}

export interface IAddClientAssignedTokenResult {
  token: IPublicClientAssignedToken;
}

export type AddClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IAddClientAssignedTokenParams,
  IAddClientAssignedTokenResult
>;
