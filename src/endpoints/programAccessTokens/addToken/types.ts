import {IPresetInput} from '../../../definitions/presetPermissionsGroup';
import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewProgramAccessTokenInput {
  name: string;
  description?: string;
  presets: IPresetInput[];
}

export interface IAddProgramAccessTokenEndpointParams {
  organizationId: string;
  token: INewProgramAccessTokenInput;
}

export interface IAddProgramAccessTokenEndpointResult {
  token: IPublicProgramAccessToken;
}

export type AddProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IAddProgramAccessTokenEndpointParams,
  IAddProgramAccessTokenEndpointResult
>;
