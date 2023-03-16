import {IFileMatcher} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type IImageTransformationParams = {
  width?: number;
  height?: number;
};

export type IReadFileEndpointParams = {
  imageTranformation?: IImageTransformationParams;
} & IFileMatcher;

export interface IReadFileEndpointResult {
  stream: NodeJS.ReadableStream;
  mimetype?: string;
  contentLength?: number;
}

export type ReadFileEndpoint = Endpoint<
  IBaseContext,
  IReadFileEndpointParams,
  IReadFileEndpointResult
>;
