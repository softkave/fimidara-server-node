import {IPublicTag} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetTagEndpointParams {
  tagId: string;
}

export interface IGetTagEndpointResult {
  tag: IPublicTag;
}

export type GetTagEndpoint = Endpoint<
  IBaseContext,
  IGetTagEndpointParams,
  IGetTagEndpointResult
>;
