import {Resource} from '../../../definitions/system';
import {IDataProvideQueryListParams, LiteralDataQuery} from '../data/types';
import {MemStoreTransactionType} from '../mem/types';

export interface SemanticDataAccessProviderRunOptions {
  transaction?: MemStoreTransactionType;
}

export interface SemanticDataAccessProviderMutationRunOptions {
  transaction: MemStoreTransactionType;
}

export interface SemanticDataAccessBaseProviderType<T extends Resource> {
  insertItem(item: T | T[], opts: SemanticDataAccessProviderMutationRunOptions): Promise<void>;
  insertWithQuery(
    queryFn: () => LiteralDataQuery<T>,
    itemsFn: (items: T[]) => T[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<T[]>;
  getOneById(id: string, opts?: SemanticDataAccessProviderRunOptions): Promise<T | null>;
  getManyByIdList(
    idList: string[],
    options?: IDataProvideQueryListParams<T> & SemanticDataAccessProviderRunOptions
  ): Promise<T[]>;
  countManyByIdList(idList: string[], opts?: SemanticDataAccessProviderRunOptions): Promise<number>;
  existsById(id: string, opts?: SemanticDataAccessProviderRunOptions): Promise<boolean>;
  updateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<T | null>;
  updateManyByQuery(
    q: LiteralDataQuery<T>,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<T[]>;
  getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<T>;
  deleteOneById(id: string, opts: SemanticDataAccessProviderMutationRunOptions): Promise<void>;
  deleteManyByIdList(
    idList: string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getOneByQuery(
    q: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<T | null>;
  getManyByQuery(
    q: LiteralDataQuery<T>,
    options?: IDataProvideQueryListParams<T> & SemanticDataAccessProviderRunOptions
  ): Promise<T[]>;
  countByQuery(
    q: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number>;
  assertGetOneByQuery(
    q: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<T>;
  existsByQuery(
    q: LiteralDataQuery<T>,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
  deleteManyByQuery(
    q: LiteralDataQuery<T>,
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
    q: {workspaceId: string; resourceIdList?: string[]; excludeResourceIdList?: string[]},
    options?: IDataProvideQueryListParams<T> & SemanticDataAccessProviderRunOptions
  ): Promise<T[]>;
  countManyByWorkspaceAndIdList(
    q: {
      workspaceId: string;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<number>;
}
