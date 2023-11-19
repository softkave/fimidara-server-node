import {Resource} from '../../../definitions/system';
import {AnyFn} from '../../../utils/types';
import {DataProviderQueryListParams, DataQuery} from '../data/types';
import {BaseContextType} from '../types';

export interface SemanticDataAccessProviderRunOptions {
  txn?: unknown;
}

export interface SemanticDataAccessProviderMutationRunOptions {
  txn: unknown;
}

export interface SemanticDataAccessBaseProviderType<T extends Resource> {
  insertItem(
    item: T | T[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getOneById(id: string, opts?: SemanticDataAccessProviderRunOptions): Promise<T | null>;
  getManyByIdList(
    idList: string[],
    options?: DataProviderQueryListParams<T> & SemanticDataAccessProviderRunOptions
  ): Promise<T[]>;
  countManyByIdList(
    idList: string[],
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number>;
  existsById(id: string, opts?: SemanticDataAccessProviderRunOptions): Promise<boolean>;
  updateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  updateManyByQuery(
    query: DataQuery<T>,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<T | null>;
  getAndUpdateManyByQuery(
    query: DataQuery<T>,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<T[]>;
  deleteOneById(
    id: string,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteManyByIdList(
    idList: string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getOneByQuery(
    query: DataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<T | null>;
  getManyByQuery(
    query: DataQuery<T>,
    options?: DataProviderQueryListParams<T> & SemanticDataAccessProviderRunOptions
  ): Promise<T[]>;
  getManyByQueryList(
    query: DataQuery<T>[],
    options?: DataProviderQueryListParams<T> & SemanticDataAccessProviderRunOptions
  ): Promise<T[]>;
  countByQuery(
    query: DataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number>;
  assertGetOneByQuery(
    query: DataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<T>;
  existsByQuery(
    query: DataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
  deleteManyByQuery(
    query: DataQuery<T>,
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
    ctx: BaseContextType,
    fn: AnyFn<[SemanticDataAccessProviderMutationRunOptions], Promise<TResult>>,

    /** Reuse existing txn options when present */
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<TResult>;
}
