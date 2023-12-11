import {PublicTag} from '../../../definitions/tag';
import {Endpoint} from '../../types';

export interface GetTagEndpointParams {
  tagId: string;
}

export interface GetTagEndpointResult {
  tag: PublicTag;
}

export type GetTagEndpoint = Endpoint<GetTagEndpointParams, GetTagEndpointResult>;
