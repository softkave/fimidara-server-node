import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteBucketParams {
  bucketId: string;
}

export type DeleteBucketEndpoint = Endpoint<IBaseContext, IDeleteBucketParams>;
