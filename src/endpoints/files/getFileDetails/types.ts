import {IFileMatcher, IPublicFile} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export type IGetFileDetailsEndpointParams = IFileMatcher;

export interface IGetFileDetailsEndpointResult {
  file: IPublicFile;
}

export type GetFileDetailsEndpoint = Endpoint<
  IBaseContext,
  IGetFileDetailsEndpointParams,
  IGetFileDetailsEndpointResult
>;
