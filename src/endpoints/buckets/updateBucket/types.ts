import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicBucket} from '../types';

export interface IUpdateBucketInput {
  maxFileSize?: number;
  name?: string;
  description?: string;
}

export interface IUpdateBucketParams {
  bucketId: string;
  bucket: IUpdateBucketInput;
}

export interface IUpdateBucketResult {
  bucket: IPublicBucket;
}

export type UpdateBucketEndpoint = Endpoint<
  IBaseContext,
  IUpdateBucketParams,
  IUpdateBucketResult
>;
