import {Readable} from 'stream';
import {
  FilePersistenceStartMultipartUploadParams,
  FilePersistenceStartMultipartUploadResult,
} from '../../../contexts/file/types.js';
import {File, FileMatcher, PublicFile} from '../../../definitions/file.js';
import {Workspace} from '../../../definitions/workspace.js';
import {Endpoint} from '../../types.js';

export interface UploadFileEndpointParams extends FileMatcher {
  description?: string;
  mimetype?: string; // TODO: define mimetypes
  encoding?: string;
  data: Readable;
  size: number;
  /** 0-based part number */
  part?: number;
  isLastPart?: boolean;
  clientMultipartId?: string;
}

export interface UploadFileEndpointResult {
  file: PublicFile;
}

export type UploadFileEndpoint = Endpoint<
  UploadFileEndpointParams,
  UploadFileEndpointResult
>;

export type IInternalMultipartIdQueueInput =
  FilePersistenceStartMultipartUploadParams & {
    namepath: string[];
  };

export type IInternalMultipartIdQueueOutput =
  FilePersistenceStartMultipartUploadResult;

export interface IPrepareFileQueueInput {
  workspace: Pick<Workspace, 'resourceId' | 'rootname'>;
  data: Pick<
    UploadFileEndpointParams,
    'filepath' | 'clientMultipartId' | 'part' | 'fileId'
  >;
}

export type IPrepareFileQueueOutput = File;
