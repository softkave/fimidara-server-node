import {FolderMatcher, PublicFolder} from '../../../definitions/folder';
import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type GetFolderEndpointParams = FolderMatcher;
export interface GetFolderEndpointResult {
  folder: PublicFolder;
}

export type GetFolderEndpoint = Endpoint<
  BaseContext,
  GetFolderEndpointParams,
  GetFolderEndpointResult
>;
