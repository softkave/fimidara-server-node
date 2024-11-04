import {FolderMatcher, PublicFolder} from '../../../definitions/folder.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface UpdateFolderInput {
  description?: string;
}

export interface UpdateFolderEndpointParams
  extends FolderMatcher,
    EndpointOptionalWorkspaceIdParam {
  folder: UpdateFolderInput;
}

export interface UpdateFolderEndpointResult {
  folder: PublicFolder;
}

export type UpdateFolderEndpoint = Endpoint<
  UpdateFolderEndpointParams,
  UpdateFolderEndpointResult
>;
