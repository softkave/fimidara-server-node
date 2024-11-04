import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetCollaboratorsEndpointParamsBase} from '../getCollaborators/types.js';

export type CountCollaboratorsWithoutPermissionEndpointParams =
  GetCollaboratorsEndpointParamsBase;

export type CountCollaboratorsWithoutPermissionEndpoint = Endpoint<
  CountCollaboratorsWithoutPermissionEndpointParams,
  CountItemsEndpointResult
>;
