import {IProgramAccessToken} from '../../../../definitions/programAccessToken';
import {
  ISemanticDataAccessNamedResourceProvider,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessProgramAccessTokenProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IProgramAccessToken>,
    ISemanticDataAccessNamedResourceProvider<IProgramAccessToken> {}
