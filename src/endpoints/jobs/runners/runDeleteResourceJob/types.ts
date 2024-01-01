import {AnyObject} from 'mongoose';
import {DeleteResourceCascadeFnDefaultArgs, Job} from '../../../../definitions/job';
import {AppResourceType, Resource} from '../../../../definitions/system';
import {AnyFn} from '../../../../utils/types';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderQueryListRunOptions,
} from '../../../contexts/semantic/types';

export type DeleteResourceCascadeFnHelpers = {
  job: Job;
  withTxn(fn: AnyFn<[SemanticProviderMutationRunOptions]>): Promise<void>;
};

export type GetComplexArtifactsFn<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = (props: {
  args: TArgs;
  helpers: DeleteResourceCascadeFnHelpers;
  opts: Pick<
    SemanticProviderQueryListRunOptions<Resource>,
    'page' | 'pageSize' | 'projection'
  >;
}) => Promise<Array<Resource> | void>;

export type DeleteSimpleArtifactsFn<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = (props: {args: TArgs; helpers: DeleteResourceCascadeFnHelpers}) => Promise<any>;

export type DeleteResourceFn<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = (props: {args: TArgs; helpers: DeleteResourceCascadeFnHelpers}) => Promise<void>;

export type DeleteResourceGetComplexArtifactsFns<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = Record<AppResourceType, GetComplexArtifactsFn<TArgs> | null>;

export type DeleteResourceDeleteSimpleArtifactsFns<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = Record<AppResourceType, DeleteSimpleArtifactsFn<TArgs> | null> &
  Partial<Record<'other', DeleteSimpleArtifactsFn<TArgs>>>;

export type DeleteResourceCascadeEntry<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = {
  getComplexArtifacts: DeleteResourceGetComplexArtifactsFns<TArgs>;
  deleteSimpleArtifacts: DeleteResourceDeleteSimpleArtifactsFns<TArgs>;
  deleteResourceFn: DeleteResourceFn<TArgs>;
};

export type DeleteResourceCascadeDefinitions = Record<
  AppResourceType,
  DeleteResourceCascadeEntry
>;
