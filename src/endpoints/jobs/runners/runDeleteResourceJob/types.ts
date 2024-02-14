import {AnyObject} from 'mongoose';
import {
  DeleteResourceCascadeFnDefaultArgs,
  DeleteResourceJobMeta,
  DeleteResourceJobParams,
  Job,
} from '../../../../definitions/job';
import {AppResourceType, Resource} from '../../../../definitions/system';
import {AnyFn} from '../../../../utils/types';
import {
  SemanticProviderMutationTxnOptions,
  SemanticProviderQueryListRunOptions,
} from '../../../contexts/semantic/types';

export type DeleteResourceCascadeFnHelpers = {
  job: Job<DeleteResourceJobParams, DeleteResourceJobMeta>;
  withTxn(fn: AnyFn<[SemanticProviderMutationTxnOptions]>): Promise<void>;
};

export type GetArtifactsFn<TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs> =
  (props: {
    args: TArgs;
    helpers: DeleteResourceCascadeFnHelpers;
    opts: Pick<
      SemanticProviderQueryListRunOptions<Resource>,
      'page' | 'pageSize' | 'projection'
    >;
  }) => Promise<Array<Resource> | void>;

export type DeleteArtifactsFn<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = (props: {args: TArgs; helpers: DeleteResourceCascadeFnHelpers}) => Promise<any>;

export type DeleteResourceFn<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = (props: {args: TArgs; helpers: DeleteResourceCascadeFnHelpers}) => Promise<void>;

export type DeleteResourceGetArtifactsFns<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = Record<AppResourceType, GetArtifactsFn<TArgs> | null>;

export type DeleteResourceDeleteArtifactsFns<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = Record<AppResourceType, DeleteArtifactsFn<TArgs> | null>;

export type DeleteResourceCascadeEntry<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = {
  getArtifacts: DeleteResourceGetArtifactsFns<TArgs>;
  deleteArtifacts: DeleteResourceDeleteArtifactsFns<TArgs>;
  deleteResourceFn: DeleteResourceFn<TArgs>;
};

export type DeleteResourceCascadeDefinitions = Record<
  AppResourceType,
  DeleteResourceCascadeEntry
>;
