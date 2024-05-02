import {FileMatcher, PublicFile} from '../../../definitions/file.js';
import {Endpoint} from '../../types.js';

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
