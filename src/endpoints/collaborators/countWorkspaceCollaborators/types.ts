import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetWorkspaceCollaboratorsEndpointParamsBase} from '../getWorkspaceCollaborators/types';

export type CountWorkspaceCollaboratorsEndpointParams =
  GetWorkspaceCollaboratorsEndpointParamsBase;

export type CountWorkspaceCollaboratorsEndpoint = Endpoint<
  CountWorkspaceCollaboratorsEndpointParams,
  CountItemsEndpointResult
>;
