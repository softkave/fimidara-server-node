import {FileMatcher, PublicFile} from '../../../definitions/file';
import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type GetFileDetailsEndpointParams = FileMatcher;

export interface GetFileDetailsEndpointResult {
  file: PublicFile;
}

export type GetFileDetailsEndpoint = Endpoint<
  BaseContext,
  GetFileDetailsEndpointParams,
  GetFileDetailsEndpointResult
>;
