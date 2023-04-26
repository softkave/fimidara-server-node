import {BaseContextType} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetWorkspaceTagsEndpointParamsBase} from '../getWorkspaceTags/types';

export type CountWorkspaceTagsEndpointParams = GetWorkspaceTagsEndpointParamsBase;

export type GetWorkspaceTagEndpoint = Endpoint<
  BaseContextType,
  CountWorkspaceTagsEndpointParams,
  CountItemsEndpointResult
>;
