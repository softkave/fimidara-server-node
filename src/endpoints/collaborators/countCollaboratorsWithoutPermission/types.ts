import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetWorkspaceCollaboratorsEndpointParamsBase} from '../getWorkspaceCollaborators/types.js';

export type CountCollaboratorsWithoutPermissionEndpointParams =
  GetWorkspaceCollaboratorsEndpointParamsBase;

export type CountCollaboratorsWithoutPermissionEndpoint = Endpoint<
  CountCollaboratorsWithoutPermissionEndpointParams,
  CountItemsEndpointResult
>;
