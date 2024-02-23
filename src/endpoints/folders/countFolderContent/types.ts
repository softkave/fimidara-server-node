import {Endpoint, EndpointResultNote} from '../../types';
import {ListFolderContentEndpointParamsBase} from '../listFolderContent/types';

export type CountFolderContentEndpointParams = ListFolderContentEndpointParamsBase;

export interface CountFolderContentEndpointResult {
  foldersCount: number;
  filesCount: number;
  notes?: EndpointResultNote[];
}

export type CountFolderContentEndpoint = Endpoint<
  CountFolderContentEndpointParams,
  CountFolderContentEndpointResult
>;
