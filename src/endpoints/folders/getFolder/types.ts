import {FolderMatcher, PublicFolder} from '../../../definitions/folder.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetFolderEndpointParams
  extends FolderMatcher,
    EndpointOptionalWorkspaceIdParam {}

export interface GetFolderEndpointResult {
  folder: PublicFolder;
}

export type GetFolderEndpoint = Endpoint<
  GetFolderEndpointParams,
  GetFolderEndpointResult
>;
