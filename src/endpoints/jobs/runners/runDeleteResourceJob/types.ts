import {AnyFn, AnyObject} from 'softkave-js-utils';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryListParams,
} from '../../../../contexts/semantic/types.js';
import {
  DeleteResourceCascadeFnDefaultArgs,
  DeleteResourceJobMeta,
  DeleteResourceJobParams,
  Job,
} from '../../../../definitions/job.js';
import {
  FimidaraResourceType,
  Resource,
} from '../../../../definitions/system.js';

export type DeleteResourceCascadeFnHelpers = {
  job: Job<DeleteResourceJobParams, DeleteResourceJobMeta>;
  withTxn(fn: AnyFn<[SemanticProviderMutationParams]>): Promise<void>;
};

export type GetArtifactsFn<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
  TPreRunMeta extends AnyObject = AnyObject,
> = (props: {
  args: TArgs;
  helpers: DeleteResourceCascadeFnHelpers;
  opts: Pick<
    SemanticProviderQueryListParams<Resource>,
    'page' | 'pageSize' | 'projection'
  >;
  preRunMeta: TPreRunMeta;
}) => Promise<Array<Resource> | void>;

export type DeleteArtifactsFn<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
  TPreRunMeta extends AnyObject = AnyObject,
> = (props: {
  args: TArgs;
  helpers: DeleteResourceCascadeFnHelpers;
  preRunMeta: TPreRunMeta;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) => Promise<any>;

export type DeleteResourceFn<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
  TPreRunMeta extends AnyObject = AnyObject,
> = (props: {
  args: TArgs;
  helpers: DeleteResourceCascadeFnHelpers;
  preRunMeta: TPreRunMeta;
}) => Promise<void>;

export type DeleteResourceGetPreRunMetaFn<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
  TResult extends AnyObject = AnyObject,
> = (props: {
  args: TArgs;
  helpers: DeleteResourceCascadeFnHelpers;
}) => Promise<TResult>;

export type DeleteResourceGetArtifactsToDeleteFns<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
  TPreRunMeta extends AnyObject = AnyObject,
> = Record<FimidaraResourceType, GetArtifactsFn<TArgs, TPreRunMeta> | null>;

export type DeleteResourceDeleteArtifactsFns<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
  TPreRunMeta extends AnyObject = AnyObject,
> = Record<FimidaraResourceType, DeleteArtifactsFn<TArgs, TPreRunMeta> | null>;

export type DeleteResourceCascadeEntry<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
  TPreRunMeta extends AnyObject = AnyObject,
> = {
  getArtifactsToDelete: DeleteResourceGetArtifactsToDeleteFns<
    TArgs,
    TPreRunMeta
  >;
  deleteArtifacts: DeleteResourceDeleteArtifactsFns<TArgs, TPreRunMeta>;
  deleteResourceFn: DeleteResourceFn<TArgs, TPreRunMeta>;
  getPreRunMetaFn: DeleteResourceGetPreRunMetaFn<TArgs, TPreRunMeta>;
};

export type DeleteResourceCascadeDefinitions = Record<
  FimidaraResourceType,
  DeleteResourceCascadeEntry
>;
