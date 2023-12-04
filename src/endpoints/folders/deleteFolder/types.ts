import {FolderMatcher} from '../../../definitions/folder';
import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint, EndpointResultNote} from '../../types';

export type DeleteFolderEndpointParams = FolderMatcher;

export interface DeleteFolderEndpointResult extends LongRunningJobResult {
  notes?: EndpointResultNote[];
}

export type DeleteFolderEndpoint = Endpoint<
  BaseContextType,
  DeleteFolderEndpointParams,
  DeleteFolderEndpointResult
>;
