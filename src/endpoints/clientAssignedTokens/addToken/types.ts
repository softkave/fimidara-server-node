import {IBaseContext} from '../../contexts/BaseContext';
import {IPresetInput} from '../../presetPermissionsGroups/types';
import {Endpoint} from '../../types';
import {IPublicClientAssignedToken} from '../types';

export interface INewClientAssignedTokenInput {
  expires?: number;
  presets: IPresetInput[];
}

export interface IAddClientAssignedTokenParams {
  organizationId?: string;
  token: INewClientAssignedTokenInput;
}

export interface IAddClientAssignedTokenResult {
  token: IPublicClientAssignedToken;
  tokenStr: string;
}

export type AddClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IAddClientAssignedTokenParams,
  IAddClientAssignedTokenResult
>;
