import {Readable} from 'stream';
import {File, FileMatcher, PublicFile} from '../../../definitions/file.js';
import {Workspace} from '../../../definitions/workspace.js';
import {Endpoint} from '../../types.js';

export interface UploadFileEndpointParams extends FileMatcher {
  description?: string;
  mimetype?: string; // TODO: define mimetypes
  encoding?: string;
  data: Readable;
  size: number;
  part?: number;
  multipartId?: string;
}

export interface UploadFileEndpointResult {
  file: PublicFile;
}

export type UploadFileEndpoint = Endpoint<
  UploadFileEndpointParams,
  UploadFileEndpointResult
>;

export interface IPrepareFileQueueInput {
  workspace: Pick<Workspace, 'resourceId' | 'rootname'>;
  data: Pick<
    UploadFileEndpointParams,
    'filepath' | 'multipartId' | 'part' | 'fileId'
  >;
}

export type IPrepareFileQueueOutput = File;
