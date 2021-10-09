import {IFolder} from '../../definitions/folder';
import {IBaseContext} from './BaseContext';

export interface IFolderProvider {
  getFolderById: (
    ctx: IBaseContext,
    folderId: string
  ) => Promise<IFolder | null>;
  assertGetFolderById: (
    ctx: IBaseContext,
    folderId: string
  ) => Promise<IFolder>;
  assertFolderById: (ctx: IBaseContext, folderId: string) => Promise<boolean>;
  updateFolderById: (
    ctx: IBaseContext,
    folderId: string,
    data: Partial<IFolder>
  ) => Promise<IFolder | null>;
  saveFolder: (ctx: IBaseContext, folder: IFolder) => Promise<IFolder>;
  deleteFolder: (ctx: IBaseContext, folderId: string) => Promise<void>;
  folderExists: (ctx: IBaseContext, name: string) => Promise<boolean>;
  bulkSaveFolders: (
    ctx: IBaseContext,
    folders: IFolder[]
  ) => Promise<IFolder[]>;
}
