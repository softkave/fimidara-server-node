import {Endpoint, EndpointResultNote} from '../../types.js';
import {ListFolderContentEndpointParamsBase} from '../listFolderContent/types.js';

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
