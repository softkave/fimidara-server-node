import {FileMatcher} from '../../../definitions/file.js';
import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint} from '../../types.js';

export interface DeleteFileEndpointParams extends FileMatcher {
  /** pass only multipartId to abort multipart upload */
  multipartId?: string;
  /** pass multipartId and part to delete a specific part of a multipart upload */
  part?: number;
}

export type DeleteFileEndpoint = Endpoint<
  DeleteFileEndpointParams,
  LongRunningJobResult
>;
