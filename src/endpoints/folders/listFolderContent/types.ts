import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IListFolderContentEndpointParams {
  bucketId?: string;
  parentFolderId?: string;
  parentFolderPath?: string;
}

export interface IListFolderContentEndpointResult {
  folders: IFolder[];
  files: IFile[];
}

export type ListFolderContentEndpoint = Endpoint<
  IBaseContext,
  IListFolderContentEndpointParams,
  IListFolderContentEndpointResult
>;
