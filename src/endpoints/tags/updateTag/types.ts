import {PublicTag} from '../../../definitions/tag';
import {Endpoint} from '../../types';
import {NewTagInput} from '../addTag/types';

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
