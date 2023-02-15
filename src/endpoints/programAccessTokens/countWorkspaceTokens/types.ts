import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';
import {IGetWorkspaceProgramAccessTokensEndpointParamsBase} from '../getWorkspaceTokens/types';

export type ICountWorkspaceProgramAccessTokensEndpointParams =
  IGetWorkspaceProgramAccessTokensEndpointParamsBase;

export type GetWorkspaceProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  ICountWorkspaceProgramAccessTokensEndpointParams,
  ICountItemsEndpointResult
>;
