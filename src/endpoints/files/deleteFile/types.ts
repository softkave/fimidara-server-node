import {FileMatcher} from '../../../definitions/file.js';
import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint} from '../../types.js';

export interface DeleteFileEndpointParams extends FileMatcher {
  /** pass only clientMultipartId to abort multipart upload */
  clientMultipartId?: string;
  /** pass clientMultipartId and part to delete a specific part of a multipart
   * upload */
  part?: number;
}

export type DeleteFileEndpoint = Endpoint<
  DeleteFileEndpointParams,
  LongRunningJobResult
>;
