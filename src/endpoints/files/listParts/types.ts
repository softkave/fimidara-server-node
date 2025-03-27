import {FileMatcher, PublicPart} from '../../../definitions/file.js';
import {Endpoint, PaginatedResult, PaginationQuery} from '../../types.js';

export interface ListPartsEndpointParams extends FileMatcher, PaginationQuery {}

export interface ListPartsEndpointResult extends PaginatedResult {
  clientMultipartId?: string;
  parts: PublicPart[];
}

export type ListPartsEndpoint = Endpoint<
  ListPartsEndpointParams,
  ListPartsEndpointResult
>;
