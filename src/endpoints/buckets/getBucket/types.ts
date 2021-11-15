import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicBucket} from '../types';

export interface IGetBucketParams {
  bucketId: string;
}

export interface IGetBucketResult {
  bucket: IPublicBucket;
}

export type GetBucketEndpoint = Endpoint<
  IBaseContext,
  IGetBucketParams,
  IGetBucketResult
>;
