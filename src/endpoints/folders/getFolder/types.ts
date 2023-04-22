import {FolderMatcher, PublicFolder} from '../../../definitions/folder';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export type GetFolderEndpointParams = FolderMatcher;
export interface GetFolderEndpointResult {
  folder: PublicFolder;
}

export type GetFolderEndpoint = Endpoint<
  BaseContextType,
  GetFolderEndpointParams,
  GetFolderEndpointResult
>;
