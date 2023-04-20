import {FolderMatcher} from '../../../definitions/folder';
import {BaseContext} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export type DeleteFolderEndpointParams = FolderMatcher;
export type DeleteFolderEndpoint = Endpoint<
  BaseContext,
  DeleteFolderEndpointParams,
  LongRunningJobResult
>;
