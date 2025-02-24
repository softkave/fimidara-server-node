import {FileMatcher, PublicFilePart} from '../../../definitions/file.js';
import {Endpoint, PaginatedResult, PaginationQuery} from '../../types.js';

export interface GetPartDetailsEndpointParams
  extends FileMatcher,
    PaginationQuery {
  multipartId?: string;
}

export interface GetPartDetailsEndpointResult extends Partial<PaginatedResult> {
  multipartId?: string;
  parts: PublicFilePart[];
}

export type GetPartDetailsEndpoint = Endpoint<
  GetPartDetailsEndpointParams,
  GetPartDetailsEndpointResult
>;
