import {FolderMatcher, PublicFolder} from '../../../definitions/folder.js';
import {Endpoint} from '../../types.js';

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
  UpdateFolderEndpointParams,
  UpdateFolderEndpointResult
>;
