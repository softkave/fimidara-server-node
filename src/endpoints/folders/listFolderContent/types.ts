import {IBaseContext} from '../../contexts/BaseContext';
import {IPublicFile} from '../../files/types';
import {Endpoint} from '../../types';
import {IPublicFolder} from '../types';

export interface IListFolderContentEndpointParams {
  // TODO: add organization ID to the endpoints
  bucketId?: string; // TODO: use bucket ID instead of bucket name
  parentFolderId?: string;
  parentFolderPath?: string;
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
