import {IFileMatcher} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type IImageTransformationParams = {
  width?: number;
  height?: number;
};

export type IGetFileEndpointParams = {
  imageTranformation?: IImageTransformationParams;
} & IFileMatcher;

export interface IGetFileEndpointResult {
  stream: NodeJS.ReadableStream;
  mimetype?: string;
  contentLength?: number;
}

export type GetFileEndpoint = Endpoint<IBaseContext, IGetFileEndpointParams, IGetFileEndpointResult>;
