import {FileMatcher, PublicFile} from '../../../definitions/file';
import {Endpoint} from '../../types';

export interface UpdateFileDetailsInput {
  description?: string;
  mimetype?: string;
}

export interface UpdateFileDetailsEndpointParams extends FileMatcher {
  file: UpdateFileDetailsInput;
}

export interface UpdateFileDetailsEndpointResult {
  file: PublicFile;
}

export type UpdateFileDetailsEndpoint = Endpoint<
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsEndpointResult
>;
