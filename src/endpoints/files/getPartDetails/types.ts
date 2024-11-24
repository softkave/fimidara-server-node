import {FilePersistenceUploadPartResult} from '../../../contexts/file/types.js';
import {FileMatcher} from '../../../definitions/file.js';
import {Endpoint, PaginationQuery} from '../../types.js';

export interface GetPartDetailsEndpointParams
  extends FileMatcher,
    Pick<PaginationQuery, 'pageSize'> {
  fromPart?: number;
}

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
