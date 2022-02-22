import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {IPresetInput} from '../../presetPermissionsGroups/types';
import {Endpoint} from '../../types';

export interface INewProgramAccessTokenInput {
  name: string;
  description?: string;
  presets: IPresetInput[];
}

export interface IAddProgramAccessTokenParams {
  organizationId: string;
  token: INewProgramAccessTokenInput;
}

export interface IAddProgramAccessTokenResult {
  token: IPublicProgramAccessToken;
  tokenStr: string;
}

export type AddProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IAddProgramAccessTokenParams,
  IAddProgramAccessTokenResult
>;
