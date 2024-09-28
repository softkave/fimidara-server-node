import {PublicTag} from '../../../definitions/tag.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface NewTagInput {
  name: string;
  description?: string;
}

export interface AddTagEndpointParams
  extends EndpointOptionalWorkspaceIDParam,
    NewTagInput {}

export interface AddTagEndpointResult {
  tag: PublicTag;
}

export type AddTagEndpoint = Endpoint<
  AddTagEndpointParams,
  AddTagEndpointResult
>;
