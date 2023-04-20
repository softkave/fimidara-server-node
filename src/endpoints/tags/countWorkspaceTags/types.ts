import {BaseContext} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetWorkspaceTagsEndpointParamsBase} from '../getWorkspaceTags/types';

export type CountWorkspaceTagsEndpointParams = GetWorkspaceTagsEndpointParamsBase;

export type GetWorkspaceTagEndpoint = Endpoint<
  BaseContext,
  CountWorkspaceTagsEndpointParams,
  CountItemsEndpointResult
>;
