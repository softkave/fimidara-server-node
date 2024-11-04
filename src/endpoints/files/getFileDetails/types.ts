import {FileMatcher, PublicFile} from '../../../definitions/file.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetFileDetailsEndpointParams
  extends FileMatcher,
    EndpointOptionalWorkspaceIdParam {}

export interface GetFileDetailsEndpointResult {
  file: PublicFile;
}

export type GetFileDetailsEndpoint = Endpoint<
  GetFileDetailsEndpointParams,
  GetFileDetailsEndpointResult
>;
