import {FolderMatcher} from '../../../definitions/folder.js';
import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointResultNote} from '../../types.js';

export type DeleteFolderEndpointParams = FolderMatcher;

export interface DeleteFolderEndpointResult extends LongRunningJobResult {
  notes?: EndpointResultNote[];
}

export type DeleteFolderEndpoint = Endpoint<
  DeleteFolderEndpointParams,
  DeleteFolderEndpointResult
>;
