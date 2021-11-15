import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicBucket} from '../types';

export interface IGetEnvironmentBucketsParams {
  environmentId: string;
}

export interface IGetEnvironmentBucketsResult {
  buckets: IPublicBucket[];
}

export type GetEnvironmentBucketEndpoint = Endpoint<
  IBaseContext,
  IGetEnvironmentBucketsParams,
  IGetEnvironmentBucketsResult
>;
