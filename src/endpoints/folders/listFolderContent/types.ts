import {IPublicFile} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicFolder} from '../types';

export interface IListFolderContentEndpointParams {
  // parentFolderId?: string;
  organizationId?: string;
  path: string;
}

export interface IListFolderContentEndpointResult {
  folders: IPublicFolder[];
  files: IPublicFile[];
}

export type ListFolderContentEndpoint = Endpoint<
  IBaseContext,
  IListFolderContentEndpointParams,
  IListFolderContentEndpointResult
>;
