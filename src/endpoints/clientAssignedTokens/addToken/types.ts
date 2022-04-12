import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IPresetInput} from '../../../definitions/presetPermissionsGroup';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewClientAssignedTokenInput {
  providedResourceId?: string;
  name?: string;
  description?: string;
  expires?: string;
  presets?: IPresetInput[];
  tags?: IAssignedTagInput[];
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
