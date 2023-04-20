import {FolderMatcher} from '../../../definitions/folder';
import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {ListFolderContentEndpointParamsBase} from '../listFolderContent/types';

export type CountFolderContentEndpointParams = ListFolderContentEndpointParamsBase;

export interface CountFolderContentEndpointResult {
  foldersCount: number;
  filesCount: number;
}

export type CountFolderContentEndpoint = Endpoint<
  BaseContext,
  FolderMatcher,
  CountFolderContentEndpointResult
>;
