import {IResourceBase, IWorkspaceResourceBase} from '../../../definitions/system';

export interface ISemanticDataAccessBaseProvider<T extends IResourceBase> {
  insertItem(item: T): Promise<void>;
  insertList(item: T[]): Promise<void>;
  getOneById(id: string): Promise<T | null>;
  existsById(id: string): Promise<boolean>;
  updateOneById(id: string, update: Partial<T>): Promise<void>;
  getAndUpdateOneById(id: string, update: Partial<T>): Promise<T>;
  deleteOneById(id: string): Promise<void>;
  deleteManyByIdList(idList: string[]): Promise<void>;
}

export interface ISemanticDataAccessNamedResourceProvider<T extends IResourceBase & {name: string}>
  extends ISemanticDataAccessBaseProvider<T> {
  getByName(name: string): Promise<T | null>;
  existsByName(name: string): Promise<boolean>;
}

export interface ISemanticDataAccessWorkspaceResourceProvider<T extends IWorkspaceResourceBase>
  extends ISemanticDataAccessBaseProvider<T> {
  getByProvidedId(workspaceId: string, providedId: string): Promise<T | null>;
  existsByProvidedId(workspaceId: string, providedId: string): Promise<boolean>;
  deleteManyByWorkspaceId(workspaceId: string): Promise<void>;
}
