import {FileMatcher, PublicFile} from '../../../definitions/file.js';
import {Endpoint} from '../../types.js';

export type GetFileDetailsEndpointParams = FileMatcher;

export interface GetFileDetailsEndpointResult {
  file: PublicFile;
}

export type GetFileDetailsEndpoint = Endpoint<
  GetFileDetailsEndpointParams,
  GetFileDetailsEndpointResult
>;
