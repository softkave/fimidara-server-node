import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicBucket} from '../types';

export interface INewBucketInput {
  organizationId: string;
  environmentId: string;
  maxFileSize: number;
  name: string;
  description?: string;
}

export interface IAddBucketParams {
  bucket: INewBucketInput;
}

export interface IAddBucketResult {
  bucket: IPublicBucket;
}

export type AddBucketEndpoint = Endpoint<
  IBaseContext,
  IAddBucketParams,
  IAddBucketResult
>;
