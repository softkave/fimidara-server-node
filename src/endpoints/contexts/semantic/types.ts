import {IResource} from '../../../definitions/system';
import {IDataProvideQueryListParams, LiteralDataQuery} from '../data/types';
import {IMemStoreTransaction} from '../mem/types';

export interface ISemanticDataAccessProviderRunOptions {
  transaction?: IMemStoreTransaction;
}

export interface ISemanticDataAccessProviderMutationRunOptions {
  transaction: IMemStoreTransaction;
}

export interface ISemanticDataAccessBaseProvider<T extends IResource> {
  insertItem(item: T | T[], opts: ISemanticDataAccessProviderMutationRunOptions): Promise<void>;
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
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  getAndUpdateOneById(
    id: string,
    update: Partial<T>,
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<T>;
  deleteOneById(id: string, opts: ISemanticDataAccessProviderMutationRunOptions): Promise<void>;
  deleteManyByIdList(
    idList: string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
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
}

export type SemanticDataAccessWorkspaceResourceProviderBaseType = IResource & {
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
    opts: ISemanticDataAccessProviderMutationRunOptions
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
