import {FileMatcher} from '../../../definitions/file';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export type ImageTransformationParams = {
  width?: number;
  height?: number;
};

export type ReadFileEndpointParams = {
  imageTranformation?: ImageTransformationParams;
} & FileMatcher;

export interface ReadFileEndpointResult {
  stream: NodeJS.ReadableStream;
  mimetype?: string;
  contentLength?: number;
}

export type ReadFileEndpoint = Endpoint<
  BaseContextType,
  ReadFileEndpointParams,
  ReadFileEndpointResult
>;

export type ReadFileEndpointHttpQuery = {w?: number; h?: number};
