import {IPublicFile} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetFileDetailsEndpointParams {
  // fileId?: string;
  path: string;
  organizationId?: string;
}

export interface IGetFileDetailsEndpointResult {
  file: IPublicFile;
}

export type GetFileDetailsEndpoint = Endpoint<
  IBaseContext,
  IGetFileDetailsEndpointParams,
  IGetFileDetailsEndpointResult
>;
