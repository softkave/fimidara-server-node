import {FileMatcher, PublicFile} from '../../../definitions/file.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface UpdateFileDetailsInput {
  description?: string;
  mimetype?: string;
}

export interface UpdateFileDetailsEndpointParams
  extends FileMatcher,
    EndpointOptionalWorkspaceIdParam {
  file: UpdateFileDetailsInput;
}

export interface UpdateFileDetailsEndpointResult {
  file: PublicFile;
}

export type UpdateFileDetailsEndpoint = Endpoint<
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsEndpointResult
>;
