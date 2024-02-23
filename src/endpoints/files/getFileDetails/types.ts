import {FileMatcher, PublicFile} from '../../../definitions/file';
import {Endpoint} from '../../types';

export type GetFileDetailsEndpointParams = FileMatcher;

export interface GetFileDetailsEndpointResult {
  file: PublicFile;
}

export type GetFileDetailsEndpoint = Endpoint<
  GetFileDetailsEndpointParams,
  GetFileDetailsEndpointResult
>;
