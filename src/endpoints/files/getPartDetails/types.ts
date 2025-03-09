import {FileMatcher} from '../../../definitions/file.js';
import {Endpoint, PaginatedResult, PaginationQuery} from '../../types.js';
import {FilePartMeta} from '../utils/multipartUploadMeta.js';

export interface GetPartDetailsEndpointParams
  extends FileMatcher,
    PaginationQuery {}

export type PublicPartDetails = Pick<FilePartMeta, 'part' | 'size'>;

export interface GetPartDetailsEndpointResult extends PaginatedResult {
  clientMultipartId?: string;
  details: PublicPartDetails[];
}

export type GetPartDetailsEndpoint = Endpoint<
  GetPartDetailsEndpointParams,
  GetPartDetailsEndpointResult
>;
