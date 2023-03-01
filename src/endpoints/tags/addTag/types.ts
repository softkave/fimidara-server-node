import {IPublicTag} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export interface INewTagInput {
  name: string;
  description?: string;
}

export interface IAddTagEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  tag: INewTagInput;
}

export interface IAddTagEndpointResult {
  tag: IPublicTag;
}

export type AddTagEndpoint = Endpoint<IBaseContext, IAddTagEndpointParams, IAddTagEndpointResult>;
