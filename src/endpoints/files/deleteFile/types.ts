import {FileMatcher} from '../../../definitions/file';
import {BaseContext} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export type DeleteFileEndpointParams = FileMatcher;
export type DeleteFileEndpoint = Endpoint<
  BaseContext,
  DeleteFileEndpointParams,
  LongRunningJobResult
>;

export type DeleteFileCascadeDeleteFnsArgs = {
  workspaceId: string;
  fileIdList: string[];
};
