import {IFileMatcher, IPublicFile} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetFileDetailsEndpointParams extends IFileMatcher {}

export interface IGetFileDetailsEndpointResult {
  file: IPublicFile;
}

export type GetFileDetailsEndpoint = Endpoint<
  IBaseContext,
  IGetFileDetailsEndpointParams,
  IGetFileDetailsEndpointResult
>;
