import {Folder, FolderMatcher} from '../../../definitions/folder';
import {LongRunningJobResult} from '../../jobs/types';
import {
  DeleteResourceCascadeFnDefaultArgs,
  Endpoint,
  EndpointResultNote,
} from '../../types';

export type DeleteFolderEndpointParams = FolderMatcher;

export interface DeleteFolderEndpointResult extends LongRunningJobResult {
  notes?: EndpointResultNote[];
}

export type DeleteFolderEndpoint = Endpoint<
  DeleteFolderEndpointParams,
  DeleteFolderEndpointResult
>;

export type DeleteFolderCascadeFnsArgs = DeleteResourceCascadeFnDefaultArgs & {
  folder: Pick<Folder, 'namepath'>;
};
