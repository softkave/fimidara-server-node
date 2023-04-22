import {FolderMatcher} from '../../../definitions/folder';
import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export type DeleteFolderEndpointParams = FolderMatcher;
export type DeleteFolderEndpoint = Endpoint<
  BaseContextType,
  DeleteFolderEndpointParams,
  LongRunningJobResult
>;
