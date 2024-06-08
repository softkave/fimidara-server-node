import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetWorkspaceCollaboratorsEndpointParamsBase} from '../getWorkspaceCollaborators/types.js';

export type CountWorkspaceCollaboratorsEndpointParams =
  GetWorkspaceCollaboratorsEndpointParamsBase;

export type CountWorkspaceCollaboratorsEndpoint = Endpoint<
  CountWorkspaceCollaboratorsEndpointParams,
  CountItemsEndpointResult
>;
