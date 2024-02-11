import {App} from '../../../definitions/app';
import {
  FileBackendConfig,
  FileBackendMount,
  ResolvedMountEntry,
} from '../../../definitions/fileBackend';
import {Job} from '../../../definitions/job';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {AppRuntimeState, Resource} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {UsageRecord} from '../../../definitions/usageRecord';
import {AnyFn} from '../../../utils/types';
import {
  DataProviderQueryListParams,
  DataProviderQueryParams,
  DataQuery,
} from '../data/types';

export interface SemanticProviderRunOptions {
  txn?: unknown;
}

export interface SemanticProviderMutationRunOptions {
  txn: unknown;
}

export interface SemanticProviderQueryRunOptions<TResource extends Partial<Resource>>
  extends SemanticProviderRunOptions,
    DataProviderQueryParams<TResource> {}

export interface SemanticProviderQueryListRunOptions<TResource extends Resource>
  extends SemanticProviderRunOptions,
    DataProviderQueryListParams<TResource> {}

export interface SemanticBaseProviderType<TResource extends Resource> {
  insertItem(
    item: TResource | TResource[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  getOneById<TFinal extends Partial<TResource> = TResource>(
    id: string,
    opts?: SemanticProviderQueryRunOptions<TFinal>
  ): Promise<TFinal | null>;
  getManyByIdList(
    idList: string[],
    options?: DataProviderQueryListParams<TResource> & SemanticProviderRunOptions
  ): Promise<TResource[]>;
  countManyByIdList(idList: string[], opts?: SemanticProviderRunOptions): Promise<number>;
  existsById(id: string, opts?: SemanticProviderRunOptions): Promise<boolean>;
  updateOneById<TFinal extends TResource>(
    id: string,
    update: Partial<TFinal>,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  updateManyByQuery(
    query: DataQuery<TResource>,
    update: Partial<TResource>,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  updateManyByQueryList(
    query: DataQuery<TResource>[],
    update: Partial<TResource>,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  getAndUpdateOneById(
    id: string,
    update: Partial<TResource>,
    opts: SemanticProviderMutationRunOptions
  ): Promise<TResource | null>;
  getAndUpdateManyByQuery(
    query: DataQuery<TResource>,
    update: Partial<TResource>,
    opts: SemanticProviderMutationRunOptions
  ): Promise<TResource[]>;
  deleteOneById(id: string, opts: SemanticProviderMutationRunOptions): Promise<void>;
  deleteManyByIdList(
    idList: string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  getOneByQuery<TFinal extends TResource = TResource>(
    query: DataQuery<TResource> | DataQuery<TFinal>,
    opts?: SemanticProviderRunOptions
  ): Promise<TFinal | null>;
  getManyByQuery<TFinal extends TResource = TResource>(
    query: DataQuery<TResource> | DataQuery<TFinal>,
    options?: DataProviderQueryListParams<TResource> & SemanticProviderRunOptions
  ): Promise<TFinal[]>;
  getManyByQueryList(
    query: DataQuery<TResource>[],
    options?: DataProviderQueryListParams<TResource> & SemanticProviderRunOptions
  ): Promise<TResource[]>;
  countByQuery<TFinal extends TResource = TResource>(
    query: DataQuery<TFinal>,
    opts?: SemanticProviderRunOptions
  ): Promise<number>;
  assertGetOneByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticProviderRunOptions
  ): Promise<TResource>;
  existsByQuery<TFinal extends TResource = TResource>(
    query: DataQuery<TFinal>,
    opts?: SemanticProviderRunOptions
  ): Promise<boolean>;
  deleteManyByQuery(
    query: DataQuery<TResource>,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
}

export type SemanticWorkspaceResourceProviderBaseType = Resource & {
  workspaceId?: string | null;
  providedResourceId?: string | null;
  name?: string;
};

export interface SemanticWorkspaceResourceProviderType<
  T extends SemanticWorkspaceResourceProviderBaseType,
> extends SemanticBaseProviderType<T> {
  getByName(
    workspaceId: string,
    name: string,
    opts?: SemanticProviderRunOptions
  ): Promise<T | null>;
  existsByName(
    workspaceId: string,
    name: string,
    opts?: SemanticProviderRunOptions
  ): Promise<boolean>;
  getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderRunOptions
  ): Promise<T | null>;
  existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderRunOptions
  ): Promise<boolean>;
  getManyByWorkspaceId(
    workspaceId: string,
    opts?: SemanticProviderQueryListRunOptions<T>
  ): Promise<T[]>;
  deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  getManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: DataProviderQueryListParams<T> & SemanticProviderRunOptions
  ): Promise<T[]>;
  countManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticProviderRunOptions
  ): Promise<number>;
}

export interface SemanticProviderUtils {
  withTxn<TResult>(
    fn: AnyFn<[SemanticProviderMutationRunOptions], Promise<TResult>>,
    /** Whether or not to reuse an existing txn from async local storage. */
    reuseAsyncLocalTxn?: boolean
  ): Promise<TResult>;
}

export type SemanticFileBackendMountProvider =
  SemanticWorkspaceResourceProviderType<FileBackendMount>;

export type SemanticAppProvider = SemanticWorkspaceResourceProviderType<App>;

export type SemanticJobProvider = SemanticBaseProviderType<Job> & {
  deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  getManyByWorkspaceId(
    workspaceId: string,
    opts?: SemanticProviderQueryListRunOptions<Job>
  ): Promise<Job[]>;
};

export type SemanticResolvedMountEntryProvider =
  SemanticWorkspaceResourceProviderType<ResolvedMountEntry> & {
    getMountEntries: (
      mountId: string,
      opts?: SemanticProviderRunOptions
    ) => Promise<ResolvedMountEntry[]>;
  };

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
