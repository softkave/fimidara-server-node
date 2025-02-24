import {FileMatcher} from '../../../definitions/file.js';
import {Endpoint} from '../../types.js';

export interface StartMultipartUploadEndpointParams extends FileMatcher {}

export interface StartMultipartUploadEndpointResult {
  multipartId: string;
}

export type StartMultipartUploadEndpoint = Endpoint<
  StartMultipartUploadEndpointParams,
  StartMultipartUploadEndpointResult
>;
