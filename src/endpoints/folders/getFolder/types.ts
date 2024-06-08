import {FolderMatcher, PublicFolder} from '../../../definitions/folder.js';
import {Endpoint} from '../../types.js';

export type GetFolderEndpointParams = FolderMatcher;
export interface GetFolderEndpointResult {
  folder: PublicFolder;
}

export type GetFolderEndpoint = Endpoint<
  GetFolderEndpointParams,
  GetFolderEndpointResult
>;
