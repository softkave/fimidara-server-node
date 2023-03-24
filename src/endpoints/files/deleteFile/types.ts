import {IFileMatcher} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/types';
import {ILongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export type IDeleteFileEndpointParams = IFileMatcher;
export type DeleteFileEndpoint = Endpoint<
  IBaseContext,
  IDeleteFileEndpointParams,
  ILongRunningJobResult
>;

export type DeleteFileCascadeDeleteFnsArgs = {
  workspaceId: string;
  fileIdList: string[];
};
