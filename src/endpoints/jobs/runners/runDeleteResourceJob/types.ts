import {
  DeleteResourceCascadeFnDefaultArgs,
  DeleteResourceJobMeta,
  DeleteResourceJobParams,
  Job,
} from '../../../../definitions/job';
import {FimidaraResourceType, Resource} from '../../../../definitions/system';
import {AnyFn, AnyObject} from '../../../../utils/types';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryListParams,
} from '../../../contexts/semantic/types';

export type DeleteResourceCascadeFnHelpers = {
  job: Job<DeleteResourceJobParams, DeleteResourceJobMeta>;
  withTxn(fn: AnyFn<[SemanticProviderMutationParams]>): Promise<void>;
};

export type GetArtifactsFn<TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs> =
  (props: {
    args: TArgs;
    helpers: DeleteResourceCascadeFnHelpers;
    opts: Pick<
      SemanticProviderQueryListParams<Resource>,
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
> = Record<FimidaraResourceType, GetArtifactsFn<TArgs> | null>;

export type DeleteResourceDeleteArtifactsFns<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = Record<FimidaraResourceType, DeleteArtifactsFn<TArgs> | null>;

export type DeleteResourceCascadeEntry<
  TArgs extends AnyObject = DeleteResourceCascadeFnDefaultArgs,
> = {
  getArtifacts: DeleteResourceGetArtifactsFns<TArgs>;
  deleteArtifacts: DeleteResourceDeleteArtifactsFns<TArgs>;
  deleteResourceFn: DeleteResourceFn<TArgs>;
};

export type DeleteResourceCascadeDefinitions = Record<
  FimidaraResourceType,
  DeleteResourceCascadeEntry
>;
