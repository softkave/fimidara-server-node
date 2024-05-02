import {PublicTag} from '../../../definitions/tag.js';
import {Endpoint} from '../../types.js';

export interface GetTagEndpointParams {
  tagId: string;
}

export interface GetTagEndpointResult {
  tag: PublicTag;
}

export type GetTagEndpoint = Endpoint<GetTagEndpointParams, GetTagEndpointResult>;
