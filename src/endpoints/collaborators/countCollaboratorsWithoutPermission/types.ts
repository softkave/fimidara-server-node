import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetWorkspaceCollaboratorsEndpointParamsBase} from '../getCollaborators/types.js';

export type CountCollaboratorsWithoutPermissionEndpointParams =
  GetWorkspaceCollaboratorsEndpointParamsBase;

export type CountCollaboratorsWithoutPermissionEndpoint = Endpoint<
  CountCollaboratorsWithoutPermissionEndpointParams,
  CountItemsEndpointResult
>;
