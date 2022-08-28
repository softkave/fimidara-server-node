import {IPublicTag} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {INewTagInput} from '../addTag/types';

export type IUpdateTagInput = Partial<INewTagInput>;

export interface IUpdateTagEndpointParams {
  tagId: string;
  tag: IUpdateTagInput;
}

export interface IUpdateTagEndpointResult {
  tag: IPublicTag;
}

export type UpdateTagEndpoint = Endpoint<
  IBaseContext,
  IUpdateTagEndpointParams,
  IUpdateTagEndpointResult
>;
