import {FileMatcher, PublicFile} from '../../../definitions/file.js';
import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint} from '../../types.js';

export interface CompleteMultipartUploadInputPart {
  part: number;
}

export interface CompleteMultipartUploadEndpointParams extends FileMatcher {
  clientMultipartId: string;
  parts: CompleteMultipartUploadInputPart[];
}

export interface CompleteMultipartUploadEndpointResult
  extends LongRunningJobResult {
  file: PublicFile;
}

export type CompleteMultipartUploadEndpoint = Endpoint<
  CompleteMultipartUploadEndpointParams,
  CompleteMultipartUploadEndpointResult
>;
