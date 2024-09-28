import {App} from '../../definitions/app.js';
import {
  FileBackendConfig,
  FileBackendMount,
} from '../../definitions/fileBackend.js';
import {PermissionGroup} from '../../definitions/permissionGroups.js';
import {Agent, AppRuntimeState, Resource} from '../../definitions/system.js';
import {Tag} from '../../definitions/tag.js';
import {UsageRecord} from '../../definitions/usageRecord.js';
import {AnyFn} from '../../utils/types.js';
import {
  DataProviderOpParams,
  DataProviderQueryListParams,
  DataProviderQueryParams,
  DataQuery,
} from '../data/types.js';

export interface SemanticProviderOpParams extends DataProviderOpParams {
  /** Defaults to `false` for query ops, `undefined` for mutation ops (affecting
   * both soft-deleted and active items), and `false` for getAndUpdate ops */
  includeDeleted?: boolean;
}

export interface SemanticProviderMutationParams
  extends SemanticProviderOpParams {
  txn: unknown;
}

export interface SemanticProviderQueryParams<
  TResource extends Partial<Resource>,
> extends SemanticProviderOpParams,
    DataProviderQueryParams<TResource> {}

export interface SemanticProviderQueryListParams<TResource extends Resource>
  extends SemanticProviderOpParams,
    DataProviderQueryListParams<TResource> {}

export interface SemanticBaseProviderType<TResource extends Resource> {
  insertItem(
    item: TResource | TResource[],
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  getOneById(
    id: string,
    opts?: SemanticProviderQueryParams<TResource>
  ): Promise<TResource | null>;
  getManyByIdList(
    idList: string[],
    options?: SemanticProviderQueryListParams<TResource>
  ): Promise<TResource[]>;
  countManyByIdList(
    idList: string[],
    opts?: SemanticProviderOpParams
  ): Promise<number>;
  existsById(id: string, opts?: SemanticProviderOpParams): Promise<boolean>;
  updateOneById(
    id: string,
    update: Partial<TResource>,
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  updateManyByQuery(
    query: DataQuery<TResource>,
    update: Partial<TResource>,
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  getAndUpdateOneById(
    id: string,
    update: Partial<TResource>,
    opts: SemanticProviderMutationParams &
      SemanticProviderQueryParams<TResource>
  ): Promise<TResource | null>;
  deleteOneById(
    id: string,
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  deleteManyByIdList(
    idList: string[],
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  softDeleteManyByIdList(
    idList: string[],
    agent: Agent,
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  getOneByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticProviderQueryParams<TResource>
  ): Promise<TResource | null>;
  getManyByQuery(
    query: DataQuery<TResource>,
    options?: SemanticProviderQueryListParams<TResource>
  ): Promise<TResource[]>;
  countByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticProviderOpParams
  ): Promise<number>;
  assertGetOneByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticProviderQueryParams<TResource>
  ): Promise<TResource>;
  existsByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticProviderOpParams
  ): Promise<boolean>;
  deleteManyByQuery(
    query: DataQuery<TResource>,
    opts: SemanticProviderMutationParams
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
    opts?: SemanticProviderQueryParams<TResource>
  ): Promise<TResource | null>;
  existsByName(
    workspaceId: string,
    name: string,
    opts?: SemanticProviderOpParams
  ): Promise<boolean>;
  getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderQueryParams<TResource>
  ): Promise<TResource | null>;
  existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticProviderOpParams
  ): Promise<boolean>;
  getManyByWorkspaceId(
    workspaceId: string,
    opts?: SemanticProviderQueryListParams<TResource>
  ): Promise<TResource[]>;
  deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  getManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: SemanticProviderQueryListParams<TResource>
  ): Promise<TResource[]>;
  countManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticProviderOpParams
  ): Promise<number>;
}

export interface SemanticProviderUtils {
  useTxnId(txn: unknown): string | undefined;
  withTxn<TResult>(
    fn: AnyFn<[SemanticProviderMutationParams], Promise<TResult>>,
    opts?: SemanticProviderMutationParams
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
