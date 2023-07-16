import {FolderMatcher} from '../../../definitions/folder';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export type CountFolderContentEndpointParams = FolderMatcher;

export interface CountFolderContentEndpointResult {
  foldersCount: number;
  filesCount: number;
}

export type CountFolderContentEndpoint = Endpoint<
  BaseContextType,
  FolderMatcher,
  CountFolderContentEndpointResult
>;
