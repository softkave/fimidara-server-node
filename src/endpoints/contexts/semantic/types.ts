import {FileBackendMount, ResolvedMountEntry} from '../../../definitions/fileBackend';
import {Job} from '../../../definitions/job';
import {Resource} from '../../../definitions/system';
import {AnyFn} from '../../../utils/types';
import {DataProviderQueryListParams, DataQuery} from '../data/types';

export interface SemanticProviderRunOptions {
  txn?: unknown;
}

export interface SemanticProviderMutationRunOptions {
  txn: unknown;
}

export interface SemanticBaseProviderType<TResource extends Resource> {
  insertItem(
    item: TResource | TResource[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  getOneById(id: string, opts?: SemanticProviderRunOptions): Promise<TResource | null>;
  getManyByIdList(
    idList: string[],
    options?: DataProviderQueryListParams<TResource> & SemanticProviderRunOptions
  ): Promise<TResource[]>;
  countManyByIdList(idList: string[], opts?: SemanticProviderRunOptions): Promise<number>;
  existsById(id: string, opts?: SemanticProviderRunOptions): Promise<boolean>;
  updateOneById(
    id: string,
    update: Partial<TResource>,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  updateManyByQuery(
    query: DataQuery<TResource>,
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
  getOneByQuery<TResource02 extends TResource = TResource>(
    query: DataQuery<TResource02>,
    opts?: SemanticProviderRunOptions
  ): Promise<TResource02 | null>;
  getManyByQuery(
    query: DataQuery<TResource>,
    options?: DataProviderQueryListParams<TResource> & SemanticProviderRunOptions
  ): Promise<TResource[]>;
  getManyByQueryList(
    query: DataQuery<TResource>[],
    options?: DataProviderQueryListParams<TResource> & SemanticProviderRunOptions
  ): Promise<TResource[]>;
  countByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticProviderRunOptions
  ): Promise<number>;
  assertGetOneByQuery(
    query: DataQuery<TResource>,
    opts?: SemanticProviderRunOptions
  ): Promise<TResource>;
  existsByQuery<TResource02 extends TResource = TResource>(
    query: DataQuery<TResource02>,
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

export interface SemanticProviderUtils<> {
  withTxn<TResult>(
    fn: AnyFn<[SemanticProviderMutationRunOptions], Promise<TResult>>,
    /** Reuse existing txn options when present */
    opts?: SemanticProviderRunOptions
  ): Promise<TResult>;
}

export type SemanticFileBackendMountProvider =
  SemanticWorkspaceResourceProviderType<FileBackendMount>;

export type SemanticJobProvider = SemanticBaseProviderType<Job> & {
  deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
};

export type SemanticResolvedMountEntryProvider =
  SemanticWorkspaceResourceProviderType<ResolvedMountEntry>;
