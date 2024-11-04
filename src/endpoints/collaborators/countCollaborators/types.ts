import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetWorkspaceCollaboratorsEndpointParamsBase} from '../getCollaborators/types.js';

export type CountCollaboratorsEndpointParams =
  GetWorkspaceCollaboratorsEndpointParamsBase;

export type CountCollaboratorsEndpoint = Endpoint<
  CountCollaboratorsEndpointParams,
  CountItemsEndpointResult
>;
