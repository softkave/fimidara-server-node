import {FileMatcher} from '../../../definitions/file.js';
import {Endpoint} from '../../types.js';

export interface SysDeleteFileEndpointParams extends FileMatcher {
  workspaceId: string;
  fileId: string;
  mountId: string;
  part?: number;
  multipartId?: string;
  namepath: string[];
  ext?: string;
}

export type SysDeleteFileEndpoint = Endpoint<SysDeleteFileEndpointParams>;
