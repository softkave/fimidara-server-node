import {Resource} from '../../../definitions/system';
import {IDataProvideQueryListParams, LiteralDataQuery} from '../data/types';
import {IMemStoreTransaction} from '../mem/types';

export interface ISemanticDataAccessProviderRunOptions {
  transaction?: IMemStoreTransaction;
}

export interface SemanticDataAccessProviderMutationRunOptions {
  transaction: IMemStoreTransaction;
}

export interface ISemanticDataAccessBaseProvider<T extends Resource> {
  insertItem(item: T | T[], opts: SemanticDataAccessProviderMutationRunOptions): Promise<void>;

  // TODO: add a function to execute if query match exists
  insertIfNotExist(
    item: T | T[],
    q: LiteralDataQuery<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getOneById(id: string, opts?: ISemanticDataAccessProviderRunOptions): Promise<T | null>;
  getManyByIdList(
    idList: string[],
    options?: IDataProvideQueryListParams<T> & ISemanticDataAccessProviderRunOptions
  ): Promise<T[]>;
  countManyByIdList(
    idList: string[],
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<number>;
  existsById(id: string, opts?: ISemanticDataAccessProviderRunOptions): Promise<boolean>;
  updateOneById(
    id: string,
    update: Partial<T>,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
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
  getOneByLiteralDataQuery(
    q: LiteralDataQuery<T>,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<T | null>;
  getManyByLiteralDataQuery(
    q: LiteralDataQuery<T>,
    options?: IDataProvideQueryListParams<T> & ISemanticDataAccessProviderRunOptions
  ): Promise<T[]>;
  countByQuery(
    q: LiteralDataQuery<T>,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<number>;
  assertGetOneByQuery(
    q: LiteralDataQuery<T>,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<T>;
  existsByQuery(
    q: LiteralDataQuery<T>,
    opts?: ISemanticDataAccessProviderRunOptions
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

export interface ISemanticDataAccessWorkspaceResourceProvider<
  T extends SemanticDataAccessWorkspaceResourceProviderBaseType
> extends ISemanticDataAccessBaseProvider<T> {
  getByName(
    workspaceId: string,
    name: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<T | null>;
  existsByName(
    workspaceId: string,
    name: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
  getByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<T | null>;
  existsByProvidedId(
    workspaceId: string,
    providedId: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
  deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getManyByWorkspaceAndIdList(
    q: {workspaceId: string; resourceIdList?: string[]; excludeResourceIdList?: string[]},
    options?: IDataProvideQueryListParams<T> & ISemanticDataAccessProviderRunOptions
  ): Promise<T[]>;
  countManyByWorkspaceAndIdList(
    q: {
      workspaceId: string;
      resourceIdList?: string[];
      excludeResourceIdList?: string[];
    },
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<number>;
}
