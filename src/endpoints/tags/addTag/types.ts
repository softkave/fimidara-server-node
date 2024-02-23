import {PublicTag} from '../../../definitions/tag';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface NewTagInput {
  name: string;
  description?: string;
}

export interface AddTagEndpointParams extends EndpointOptionalWorkspaceIDParam {
  tag: NewTagInput;
}

export interface AddTagEndpointResult {
  tag: PublicTag;
}

export type AddTagEndpoint = Endpoint<AddTagEndpointParams, AddTagEndpointResult>;
