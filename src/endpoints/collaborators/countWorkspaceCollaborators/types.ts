import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';
import {IGetWorkspaceCollaboratorsEndpointParamsBase} from '../getWorkspaceCollaborators/types';

export type ICountWorkspaceCollaboratorsEndpointParams =
  IGetWorkspaceCollaboratorsEndpointParamsBase;

export type CountWorkspaceCollaboratorsEndpoint = Endpoint<
  IBaseContext,
  ICountWorkspaceCollaboratorsEndpointParams,
  ICountItemsEndpointResult
>;
