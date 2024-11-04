import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetWorkspaceTagsEndpointParamsBase} from '../getTags/types.js';

export type CountTagsEndpointParams = GetWorkspaceTagsEndpointParamsBase;

export type CountTagsEndpoint = Endpoint<
  CountTagsEndpointParams,
  CountItemsEndpointResult
>;
