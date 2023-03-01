import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export interface INewProgramAccessTokenInput {
  name: string;
  description?: string;
  tags?: IAssignedTagInput[];
}

export interface IAddProgramAccessTokenEndpointParams extends IEndpointOptionalWorkspaceIDParam {
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
