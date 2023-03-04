import {IResourceBase} from '../../../definitions/system';
import {IDataProvideQueryListParams} from '../data/types';

export interface ISemanticDataAccessBaseProvider<T extends IResourceBase> {
  insertItem(item: T): Promise<void>;
  insertList(item: T[]): Promise<void>;
  getOneById(id: string): Promise<T | null>;
  getManyByIdList(idList: string[], options?: IDataProvideQueryListParams<T>): Promise<T[]>;
  countManyByIdList(idList: string[]): Promise<number>;
  existsById(id: string): Promise<boolean>;
  updateOneById(id: string, update: Partial<T>): Promise<void>;
  getAndUpdateOneById(id: string, update: Partial<T>): Promise<T>;
  deleteOneById(id: string): Promise<void>;
  deleteManyByIdList(idList: string[]): Promise<void>;
}

export interface ISemanticDataAccessWorkspaceResourceProvider<
  T extends IResourceBase & {
    workspaceId?: string | null;
    providedResourceId?: string | null;
    name?: string;
  }
> extends ISemanticDataAccessBaseProvider<T> {
  getByName(workspaceId: string, name: string): Promise<T | null>;
  existsByName(workspaceId: string, name: string): Promise<boolean>;
  getByProvidedId(workspaceId: string, providedId: string): Promise<T | null>;
  existsByProvidedId(workspaceId: string, providedId: string): Promise<boolean>;
  deleteManyByWorkspaceId(workspaceId: string): Promise<void>;
  getManyByWorkspaceAndIdList(
    q: {workspaceId: string; resourceIdList?: string[]; excludeResourceIdList?: string[]},
    options?: IDataProvideQueryListParams<T>
  ): Promise<T[]>;
  countManyByWorkspaceAndIdList(q: {
    workspaceId: string;
    resourceIdList?: string[];
    excludeResourceIdList?: string[];
  }): Promise<number>;
}
