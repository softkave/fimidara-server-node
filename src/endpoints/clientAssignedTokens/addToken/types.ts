import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IPresetInput} from '../../../definitions/presetPermissionsGroup';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewClientAssignedTokenInput {
  providedResourceId?: string;
  expires?: string;
  presets?: IPresetInput[];
}

export interface IAddClientAssignedTokenEndpointParams {
  organizationId?: string;
  token: INewClientAssignedTokenInput;
}

export interface IAddClientAssignedTokenEndpointResult {
  token: IPublicClientAssignedToken;
}

export type AddClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IAddClientAssignedTokenEndpointParams,
  IAddClientAssignedTokenEndpointResult
>;
