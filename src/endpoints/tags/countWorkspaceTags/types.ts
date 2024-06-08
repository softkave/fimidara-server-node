import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetWorkspaceTagsEndpointParamsBase} from '../getWorkspaceTags/types.js';

export type CountWorkspaceTagsEndpointParams = GetWorkspaceTagsEndpointParamsBase;

export type CountWorkspaceTagsEndpoint = Endpoint<
  CountWorkspaceTagsEndpointParams,
  CountItemsEndpointResult
>;
