import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';
import {IGetWorkspaceTagsEndpointParamsBase} from '../getWorkspaceTags/types';

export type ICountWorkspaceTagsEndpointParams = IGetWorkspaceTagsEndpointParamsBase;

export type GetWorkspaceTagEndpoint = Endpoint<
  IBaseContext,
  ICountWorkspaceTagsEndpointParams,
  ICountItemsEndpointResult
>;
