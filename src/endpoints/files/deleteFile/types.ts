import {File, FileMatcher} from '../../../definitions/file';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export type DeleteFileEndpointParams = FileMatcher;
export type DeleteFileEndpoint = Endpoint<DeleteFileEndpointParams, LongRunningJobResult>;

export type DeleteFileCascadeDeleteFnsArgs = {
  workspaceId: string;
  fileIdList: string[];
  files: Array<Pick<File, 'resourceId' | 'namepath' | 'extension'>>;
};
