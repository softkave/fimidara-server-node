import {PublicTag} from '../../../definitions/tag';
import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface GetTagEndpointParams {
  tagId: string;
}

export interface GetTagEndpointResult {
  tag: PublicTag;
}

export type GetTagEndpoint = Endpoint<BaseContext, GetTagEndpointParams, GetTagEndpointResult>;
