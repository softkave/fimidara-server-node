import {FileMatcher} from '../../../definitions/file.js';
import {Endpoint, PaginationQuery} from '../../types.js';
import {FilePartMeta} from '../utils/multipartUploadMeta.js';

export interface GetPartDetailsEndpointParams
  extends FileMatcher,
    Pick<PaginationQuery, 'pageSize'> {
  continuationToken?: string;
}

export type PublicPartDetails = Pick<FilePartMeta, 'part' | 'size'>;

export interface GetPartDetailsEndpointResult {
  clientMultipartId?: string;
  continuationToken?: string;
  isDone?: boolean;
  details: PublicPartDetails[];
}

export type GetPartDetailsEndpoint = Endpoint<
  GetPartDetailsEndpointParams,
  GetPartDetailsEndpointResult
>;
