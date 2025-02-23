import {Readable} from 'stream';
import {Endpoint} from '../../types.js';

export type SysReadFileEndpointParams = {
  workspaceId: string;
  fileId: string;
  mountId: string;
  part?: number;
  multipartId?: string;
  namepath: string[];
  ext?: string;
};

export interface SysReadFileEndpointResult {
  contentLength?: number;
  stream: Readable;
}

export type SysReadFileEndpoint = Endpoint<
  SysReadFileEndpointParams,
  SysReadFileEndpointResult
>;
