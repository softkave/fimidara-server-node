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
  SemanticProviderMutationRunOptions,
  SemanticProviderQueryListRunOptions,
} from '../../../contexts/semantic/types';

export type DeleteResourceCascadeFnHelpers = {
  job: Job<DeleteResourceJobParams, DeleteResourceJobMeta>;
  withTxn(fn: AnyFn<[SemanticProviderMutationRunOptions]>): Promise<void>;
};

export type getArtifactsFn<TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs> =
  (props: {
    args: TArgs;
    helpers: DeleteResourceCascadeFnHelpers;
    opts: Pick<
      SemanticProviderQueryListRunOptions<Resource>,
      'page' | 'pageSize' | 'projection'
    >;
  }) => Promise<Array<Resource> | void>;

export type deleteArtifactsFn<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = (props: {args: TArgs; helpers: DeleteResourceCascadeFnHelpers}) => Promise<any>;

export type DeleteResourceFn<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = (props: {args: TArgs; helpers: DeleteResourceCascadeFnHelpers}) => Promise<void>;

export type DeleteResourceGetArtifactsFns<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = Record<AppResourceType, getArtifactsFn<TArgs> | null>;

export type DeleteResourceDeleteArtifactsFns<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = Record<AppResourceType, deleteArtifactsFn<TArgs> | null>;

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
