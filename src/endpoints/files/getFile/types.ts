import {IPublicFile} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IImageTransformationParams {
  width?: number;
  height?: number;
}

export interface IGetFileEndpointParams {
  // fileId: string;
  path: string;
  organizationId?: string;
  imageTranformation?: IImageTransformationParams;
}

export interface IGetFileEndpointResult {
  buffer: Buffer;
  file: IPublicFile;
}

export type GetFileEndpoint = Endpoint<
  IBaseContext,
  IGetFileEndpointParams,
  IGetFileEndpointResult
>;
