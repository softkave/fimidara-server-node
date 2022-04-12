import {IPublicTag} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewTagInput {
  name: string;
  description?: string;
}

export interface IAddTagEndpointParams {
  workspaceId?: string;
  tag: INewTagInput;
}

export interface IAddTagEndpointResult {
  tag: IPublicTag;
}

export type AddTagEndpoint = Endpoint<
  IBaseContext,
  IAddTagEndpointParams,
  IAddTagEndpointResult
>;
