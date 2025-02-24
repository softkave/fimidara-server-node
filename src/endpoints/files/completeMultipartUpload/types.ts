import {FileMatcher, PublicFile} from '../../../definitions/file.js';
import {Endpoint} from '../../types.js';

export interface CompleteMultipartUploadPart {
  part: number;
  partId: string;
}

export interface CompleteMultipartUploadEndpointParams extends FileMatcher {
  multipartId: string;
  parts: CompleteMultipartUploadPart[];
}

export interface CompleteMultipartUploadEndpointResult {
  file: PublicFile;
}

export type CompleteMultipartUploadEndpoint = Endpoint<
  CompleteMultipartUploadEndpointParams,
  CompleteMultipartUploadEndpointResult
>;
