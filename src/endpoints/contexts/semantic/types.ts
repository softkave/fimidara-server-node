import {Resource} from '../../../definitions/system';
import {AnyFn} from '../../../utils/types';
import {DataProviderQueryListParams, LiteralDataQuery} from '../data/types';
import {BaseContextType} from '../types';

export interface SemanticDataAccessProviderRunOptions<TTxn = unknown> {
  transaction?: TTxn;
}

export interface SemanticDataAccessProviderMutationRunOptions<TTxn = unknown> {
  transaction: TTxn;
}

export interface SemanticDataAccessBaseProviderType<T extends Resource, TTxn> {
  insertItem(
    item: T | T[],
    opts: SemanticDataAccessProviderMutationRunOptions<TTxn>
  ): Promise<void>;
  insertWithQuery(
    queryFn: () => LiteralDataQuery<T>,
    itemsFn: (items: T[]) => T[],
    opts: SemanticDataAccessProviderMutationRunOptions<TTxn>
  ): Promise<T[]>;
  getOneById(id: string, opts?: SemanticDataAccessProviderRunOptions<TTxn>): Promise<T | null>;
  getManyByIdList(
    idList: string[],
    options?: DataProviderQueryListParams<T> & SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<T[]>;
  countManyByIdList(
    idList: string[],
    opts?: SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<number>;
  existsById(id: string, opts?: SemanticDataAccessProviderRunOptions<TTxn>): Promise<boolean>;
  updateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions<TTxn>
  ): Promise<T | null>;
  updateManyByQuery(
    query: LiteralDataQuery<T>,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions<TTxn>
  ): Promise<T[]>;
  getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions<TTxn>
  ): Promise<T>;
  deleteOneById(
    id: string,
    opts: SemanticDataAccessProviderMutationRunOptions<TTxn>
  ): Promise<void>;
  deleteManyByIdList(
    idList: string[],
    opts: SemanticDataAccessProviderMutationRunOptions<TTxn>
  ): Promise<void>;
  getOneByQuery(
    query: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<T | null>;
  getManyByQuery(
    query: LiteralDataQuery<T>,
    options?: DataProviderQueryListParams<T> & SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<T[]>;
  countByQuery(
    query: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<number>;
  assertGetOneByQuery(
    query: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<T>;
  existsByQuery(
    query: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<boolean>;
  deleteManyByQuery(
    query: LiteralDataQuery<T>,
    opts: SemanticDataAccessProviderMutationRunOptions<TTxn>
  ): Promise<void>;
}

export type SemanticDataAccessWorkspaceResourceProviderBaseType = Resource & {
  workspaceId?: string | null;
  providedResourceId?: string | null;
  name?: string;
};

export interface SemanticDataAccessWorkspaceResourceProviderType<
  T extends SemanticDataAccessWorkspaceResourceProviderBaseType,
  TTxn
> extends SemanticDataAccessBaseProviderType<T, TTxn> {
  getByName(
    workspaceId: string,
    name: string,
    opts?: SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<T | null>;
  existsByName(
    workspaceId: string,
    name: string,
    opts?: SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<boolean>;
  getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<T | null>;
  existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<boolean>;
  deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticDataAccessProviderMutationRunOptions<TTxn>
  ): Promise<void>;
  getManyByWorkspaceAndIdList(
    query: {workspaceId: string; resourceIdList?: string[]; excludeResourceIdList?: string[]},
    options?: DataProviderQueryListParams<T> & SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<T[]>;
  countManyByWorkspaceAndIdList(
    query: {
      workspaceId: string;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticDataAccessProviderRunOptions<TTxn>
  ): Promise<number>;
}

export interface SemanticDataAccessProviderUtils<TTxn = unknown> {
  withTxn<TResult>(
    ctx: BaseContextType,
    fn: AnyFn<[txn: TTxn], Promise<TResult>>
  ): Promise<TResult>;
}
