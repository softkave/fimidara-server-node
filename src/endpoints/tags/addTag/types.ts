import {PublicTag} from '../../../definitions/tag.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface NewTagInput {
  name: string;
  description?: string;
}

export interface AddTagEndpointParams
  extends EndpointOptionalWorkspaceIdParam,
    NewTagInput {}

export interface AddTagEndpointResult {
  tag: PublicTag;
}

export type AddTagEndpoint = Endpoint<
  AddTagEndpointParams,
  AddTagEndpointResult
>;
