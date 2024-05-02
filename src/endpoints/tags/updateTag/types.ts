import {PublicTag} from '../../../definitions/tag.js';
import {Endpoint} from '../../types.js';
import {NewTagInput} from '../addTag/types.js';

export type UpdateTagInput = Partial<NewTagInput>;

export interface UpdateTagEndpointParams {
  tagId: string;
  tag: UpdateTagInput;
}

export interface UpdateTagEndpointResult {
  tag: PublicTag;
}

export type UpdateTagEndpoint = Endpoint<
  UpdateTagEndpointParams,
  UpdateTagEndpointResult
>;
