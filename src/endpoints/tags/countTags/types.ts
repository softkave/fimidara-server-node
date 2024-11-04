import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetTagsEndpointParamsBase} from '../getTags/types.js';

export type CountTagsEndpointParams = GetTagsEndpointParamsBase;

export type CountTagsEndpoint = Endpoint<
  CountTagsEndpointParams,
  CountItemsEndpointResult
>;
