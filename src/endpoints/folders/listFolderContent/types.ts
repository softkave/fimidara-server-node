import {IPublicFile} from '../../../definitions/file';
import {IPublicFolder} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

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
