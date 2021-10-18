import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetFileEndpointParams {
  fileId: string;
}

export interface IGetFileEndpointResult {
  file: Buffer;
}

export type GetFileEndpoint = Endpoint<
  IBaseContext,
  IGetFileEndpointParams,
  IGetFileEndpointResult
>;
