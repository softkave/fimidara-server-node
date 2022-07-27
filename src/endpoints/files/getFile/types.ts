import {IFileMatcher} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IImageTransformationParams {
  width?: number;
  height?: number;
}

export interface IGetFileEndpointParams extends IFileMatcher {
  imageTranformation?: IImageTransformationParams;
}

export interface IGetFileEndpointResult {
  stream: NodeJS.ReadableStream;
  mimetype?: string;
  contentLength?: number;
}

export type GetFileEndpoint = Endpoint<
  IBaseContext,
  IGetFileEndpointParams,
  IGetFileEndpointResult
>;
