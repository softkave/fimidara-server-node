import {App} from '../../../definitions/app';
import {FileBackendConfig, FileBackendMount} from '../../../definitions/fileBackend';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {Agent, AppRuntimeState, Resource} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {UsageRecord} from '../../../definitions/usageRecord';
import {AnyFn, OmitProperties} from '../../../utils/types';
import {
  DataProviderOpParams,
  DataProviderQueryListParams,
  DataProviderQueryParams,
  DataQuery,
} from '../data/types';

export interface SemanticProviderTxnOptions {
  txn?: unknown;
}

export interface SemanticProviderMutationTxnOptions {
  txn: unknown;
}

export interface SemanticProviderOpOptions
  extends SemanticProviderTxnOptions,
    DataProviderOpParams {
  includeDeleted?: boolean;
  isDeleted?: boolean;
}

export interface SemanticProviderMutationOpOptions
  extends OmitProperties<SemanticProviderOpOptions, 'txn'>,
    SemanticProviderMutationTxnOptions {}

export interface SemanticProviderQueryRunOptions<TResource extends Partial<Resource>>
  extends SemanticProviderOpOptions,
    DataProviderQueryParams<TResource> {}

export interface SemanticProviderQueryListRunOptions<TResource extends Resource>
  extends SemanticProviderOpOptions,
    DataProviderQueryListParams<TResource> {}

export interface SemanticBaseProviderType<TResource extends Resource> {
  insertItem(
    item: TResource | TResource[],
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
  getOneById(
    id: string,
    opts?: SemanticProviderQueryRunOptions<TResource>
  ): Promise<TResource | null>;
  getManyByIdList(
    idList: string[],
    options?: SemanticProviderQueryListRunOptions<TResource>
  ): Promise<TResource[]>;
  countManyByIdList(idList: string[], opts?: SemanticProviderOpOptions): Promise<number>;
  existsById(id: string, opts?: SemanticProviderOpOptions): Promise<boolean>;
  updateOneById(
    id: string,
    update: Partial<TResource>,
    opts: SemanticProviderMutationOpOptions
  ): Promise<void>;
  updateManyByQuery(
    query: DataQuery<TResource>,
    update: Partial<TResource>,
    opts: SemanticProviderMutationOpOptions
  ): Promise<void>;
  getAndUpdateOneById(
    id: string,
    update: Partial<TResource>,
    opts: SemanticProviderMutationOpOptions & SemanticProviderQueryRunOptions<TResource>
  ): Promise<TResource | null>;
  deleteOneById(id: string, opts: SemanticProviderMutationTxnOptions): Promise<void>;
  deleteManyByIdList(
    idList: string[],
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
  softDeleteManyByIdList(
    idList: string[],
    agent: Agent,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
  getOneByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticProviderQueryRunOptions<TResource>
  ): Promise<TResource | null>;
  getManyByQuery(
    query: DataQuery<TResource>,
    options?: SemanticProviderQueryListRunOptions<TResource>
  ): Promise<TResource[]>;
  countByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticProviderOpOptions
  ): Promise<number>;
  assertGetOneByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticProviderQueryRunOptions<TResource>
  ): Promise<TResource>;
  existsByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticProviderOpOptions
  ): Promise<boolean>;
  deleteManyByQuery(
    query: DataQuery<TResource>,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
}

export type SemanticWorkspaceResourceProviderBaseType = Resource & {
  workspaceId?: string | null;
  providedResourceId?: string | null;
  name?: string;
};

export interface SemanticWorkspaceResourceProviderType<
  TResource extends SemanticWorkspaceResourceProviderBaseType,
> extends SemanticBaseProviderType<TResource> {
  getByName(
    workspaceId: string,
    name: string,
    opts?: SemanticProviderQueryRunOptions<TResource>
  ): Promise<TResource | null>;
  existsByName(
    workspaceId: string,
    name: string,
    opts?: SemanticProviderOpOptions
  ): Promise<boolean>;
  getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderQueryRunOptions<TResource>
  ): Promise<TResource | null>;
  existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderOpOptions
  ): Promise<boolean>;
  getManyByWorkspaceId(
    workspaceId: string,
    opts?: SemanticProviderQueryListRunOptions<TResource>
  ): Promise<TResource[]>;
  deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
  getManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: SemanticProviderQueryListRunOptions<TResource>
  ): Promise<TResource[]>;
  countManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticProviderOpOptions
  ): Promise<number>;
}

export interface SemanticProviderUtils {
  withTxn<TResult>(
    fn: AnyFn<[SemanticProviderMutationTxnOptions], Promise<TResult>>,
    /** Whether or not to reuse an existing txn from async local storage. */
    reuseAsyncLocalTxn?: boolean
  ): Promise<TResult>;
}

export type SemanticFileBackendMountProvider =
  SemanticWorkspaceResourceProviderType<FileBackendMount>;

export type SemanticAppProvider = SemanticWorkspaceResourceProviderType<App>;

export interface SemanticTagProviderType
  extends SemanticWorkspaceResourceProviderType<Tag> {}

export interface SemanticUsageRecordProviderType
  extends SemanticWorkspaceResourceProviderType<UsageRecord> {}

export interface SemanticPermissionGroupProviderType
  extends SemanticWorkspaceResourceProviderType<PermissionGroup> {}

export interface SemanticFileBackendConfigProvider
  extends SemanticWorkspaceResourceProviderType<FileBackendConfig> {}

export interface SemanticAppRuntimeStateProvider
  extends SemanticBaseProviderType<AppRuntimeState> {}
