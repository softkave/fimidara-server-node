import {IPresetInput} from '../../../definitions/presetPermissionsGroup';
import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewProgramAccessTokenInput {
  name: string;
  description?: string;
  presets?: IPresetInput[];
  tags?: IAssignedTagInput[];
}

export interface IAddProgramAccessTokenEndpointParams {
  workspaceId?: string;
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
