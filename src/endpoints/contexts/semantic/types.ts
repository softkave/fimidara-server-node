import {FileBackendMount} from '../../../definitions/fileBackend';
import {Job} from '../../../definitions/job';
import {Resource} from '../../../definitions/system';
import {AnyFn} from '../../../utils/types';
import {DataProviderQueryListParams, DataQuery} from '../data/types';

export interface SemanticDataAccessProviderRunOptions {
  txn?: unknown;
}

export interface SemanticDataAccessProviderMutationRunOptions {
  txn: unknown;
}

export interface SemanticDataAccessBaseProviderType<TResource extends Resource> {
  insertItem(
    item: TResource | TResource[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getOneById(
    id: string,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<TResource | null>;
  getManyByIdList(
    idList: string[],
    options?: DataProviderQueryListParams<TResource> &
      SemanticDataAccessProviderRunOptions
  ): Promise<TResource[]>;
  countManyByIdList(
    idList: string[],
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number>;
  existsById(id: string, opts?: SemanticDataAccessProviderRunOptions): Promise<boolean>;
  updateOneById(
    id: string,
    update: Partial<TResource>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  updateManyByQuery(
    query: DataQuery<TResource>,
    update: Partial<TResource>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getAndUpdateOneById(
    id: string,
    update: Partial<TResource>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<TResource | null>;
  getAndUpdateManyByQuery(
    query: DataQuery<TResource>,
    update: Partial<TResource>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<TResource[]>;
  deleteOneById(
    id: string,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteManyByIdList(
    idList: string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getOneByQuery<TResource02 extends TResource = TResource>(
    query: DataQuery<TResource02>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<TResource02 | null>;
  getManyByQuery(
    query: DataQuery<TResource>,
    options?: DataProviderQueryListParams<TResource> &
      SemanticDataAccessProviderRunOptions
  ): Promise<TResource[]>;
  getManyByQueryList(
    query: DataQuery<TResource>[],
    options?: DataProviderQueryListParams<TResource> &
      SemanticDataAccessProviderRunOptions
  ): Promise<TResource[]>;
  countByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number>;
  assertGetOneByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<TResource>;
  existsByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
  deleteManyByQuery(
    query: DataQuery<TResource>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
}

export type SemanticDataAccessWorkspaceResourceProviderBaseType = Resource & {
  workspaceId?: string | null;
  providedResourceId?: string | null;
  name?: string;
};

export interface SemanticDataAccessWorkspaceResourceProviderType<
  T extends SemanticDataAccessWorkspaceResourceProviderBaseType
> extends SemanticDataAccessBaseProviderType<T> {
  getByName(
    workspaceId: string,
    name: string,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<T | null>;
  existsByName(
    workspaceId: string,
    name: string,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
  getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<T | null>;
  existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
  deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    options?: DataProviderQueryListParams<T> & SemanticDataAccessProviderRunOptions
  ): Promise<T[]>;
  countManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number>;
}

export interface SemanticDataAccessProviderUtils<> {
  withTxn<TResult>(
    fn: AnyFn<[SemanticDataAccessProviderMutationRunOptions], Promise<TResult>>,
    /** Reuse existing txn options when present */
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<TResult>;
}

export type SemanticDataAccessFileBackendMountProvider =
  SemanticDataAccessWorkspaceResourceProviderType<FileBackendMount>;
export type SemanticDataAccessJobProvider = SemanticDataAccessBaseProviderType<Job>;
