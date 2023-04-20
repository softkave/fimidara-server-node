import {FolderMatcher, PublicFolder} from '../../../definitions/folder';
import {BaseContext} from '../../contexts/types';
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
  BaseContext,
  UpdateFolderEndpointParams,
  UpdateFolderEndpointResult
>;
