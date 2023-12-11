import {FolderMatcher, PublicFolder} from '../../../definitions/folder';
import {Endpoint} from '../../types';

export type GetFolderEndpointParams = FolderMatcher;
export interface GetFolderEndpointResult {
  folder: PublicFolder;
}

export type GetFolderEndpoint = Endpoint<
  GetFolderEndpointParams,
  GetFolderEndpointResult
>;
