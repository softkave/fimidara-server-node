import {FolderMatcher} from '../../../definitions/folder.js';
import {LongRunningJobResult} from '../../jobs/types.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  EndpointResultNote,
} from '../../types.js';

export interface DeleteFolderEndpointParams
  extends FolderMatcher,
    EndpointOptionalWorkspaceIdParam {}

export interface DeleteFolderEndpointResult extends LongRunningJobResult {
  notes?: EndpointResultNote[];
}

export type DeleteFolderEndpoint = Endpoint<
  DeleteFolderEndpointParams,
  DeleteFolderEndpointResult
>;
