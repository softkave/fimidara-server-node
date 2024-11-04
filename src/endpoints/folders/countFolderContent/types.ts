import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  EndpointResultNote,
} from '../../types.js';
import {ListFolderContentEndpointParamsBase} from '../listFolderContent/types.js';

export interface CountFolderContentEndpointParams
  extends ListFolderContentEndpointParamsBase,
    EndpointOptionalWorkspaceIdParam {}

export interface CountFolderContentEndpointResult {
  foldersCount: number;
  filesCount: number;
  notes?: EndpointResultNote[];
}

export type CountFolderContentEndpoint = Endpoint<
  CountFolderContentEndpointParams,
  CountFolderContentEndpointResult
>;
