import {FolderMatcher, PublicFolder} from '../../../definitions/folder';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface UpdateFolderInput {
  description?: string;
}

export interface UpdateFolderEndpointParams extends FolderMatcher {
  folder: UpdateFolderInput;
}

export interface UpdateFolderEndpointResult {
  folder: PublicFolder;
}

export type UpdateFolderEndpoint = Endpoint<
  BaseContextType,
  UpdateFolderEndpointParams,
  UpdateFolderEndpointResult
>;
