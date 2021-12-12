import {IBaseContext} from '../../contexts/BaseContext';
import {IPresetInput} from '../../presetPermissionsGroups/types';
import {Endpoint} from '../../types';
import {IPublicProgramAccessToken} from '../types';

export interface IAddProgramAccessTokenParams {
  organizationId: string;
  description?: string;
  presets: IPresetInput[];
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
