import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetCollaboratorsEndpointParamsBase} from '../getCollaborators/types.js';

export type CountCollaboratorsEndpointParams =
  GetCollaboratorsEndpointParamsBase;

export type CountCollaboratorsEndpoint = Endpoint<
  CountCollaboratorsEndpointParams,
  CountItemsEndpointResult
>;
