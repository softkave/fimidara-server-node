import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetWorkspaceTagsEndpointParamsBase} from '../getWorkspaceTags/types';

export type CountWorkspaceTagsEndpointParams = GetWorkspaceTagsEndpointParamsBase;

export type CountWorkspaceTagsEndpoint = Endpoint<
  CountWorkspaceTagsEndpointParams,
  CountItemsEndpointResult
>;
