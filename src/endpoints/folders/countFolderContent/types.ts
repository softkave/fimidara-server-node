import {IFolderMatcher} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {IListFolderContentEndpointParamsBase} from '../listFolderContent/types';

export type ICountFolderContentEndpointParams = IListFolderContentEndpointParamsBase;

export interface ICountFolderContentEndpointResult {
  foldersCount: number;
  filesCount: number;
}

export type CountFolderContentEndpoint = Endpoint<
  IBaseContext,
  IFolderMatcher,
  ICountFolderContentEndpointResult
>;
