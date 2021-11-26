import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicFile} from '../types';

export interface IGetFileDetailsEndpointParams {
  // fileId?: string;
  path: string;
}

export interface IGetFileDetailsEndpointResult {
  file: IPublicFile;
}

export type GetFileDetailsEndpoint = Endpoint<
  IBaseContext,
  IGetFileDetailsEndpointParams,
  IGetFileDetailsEndpointResult
>;
