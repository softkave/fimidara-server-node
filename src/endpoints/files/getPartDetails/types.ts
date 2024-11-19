import {FilePersistenceUploadPartResult} from '../../../contexts/file/types.js';
import {FileMatcher} from '../../../definitions/file.js';
import {Endpoint} from '../../types.js';

export type GetPartDetailsEndpointParams = FileMatcher;

export type PublicPartDetails = Pick<
  FilePersistenceUploadPartResult,
  'part' | 'size'
>;

export interface GetPartDetailsEndpointResult {
  clientMultipartId?: string;
  details: PublicPartDetails[];
}

export type GetPartDetailsEndpoint = Endpoint<
  GetPartDetailsEndpointParams,
  GetPartDetailsEndpointResult
>;
