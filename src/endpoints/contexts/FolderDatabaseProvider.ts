import {IFolder} from '../../definitions/folder';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {FolderDoesNotExistError} from '../folders/errors';
import {IBaseContext} from './BaseContext';
import {IFolderProvider} from './FolderProvider';

export default class FolderDatabaseProvider implements IFolderProvider {
  public getFolderById = wrapFireAndThrowError(
    (ctx: IBaseContext, folderId: string) => {
      return ctx.db.folder
        .findOne({
          folderId,
        })
        .lean()
        .exec();
    }
  );

  public assertGetFolderById = wrapFireAndThrowError(
    async (ctx: IBaseContext, folderId: string) => {
      const folder = await ctx.folder.getFolderById(ctx, folderId);

      if (!folder) {
        throw new FolderDoesNotExistError();
      }

      return folder;
    }
  );

  public assertFolderById = wrapFireAndThrowError(
    async (ctx: IBaseContext, folderId: string) => {
      const exists = await ctx.db.folder.exists({
        folderId,
      });

      if (!exists) {
        throw new FolderDoesNotExistError();
      }

      return exists;
    }
  );

  public updateFolderById = wrapFireAndThrowError(
    (ctx: IBaseContext, folderId: string, data: Partial<IFolder>) => {
      return ctx.db.folder
        .findOneAndUpdate({folderId}, data, {
          new: true,
        })
        .lean()
        .exec();
    }
  );

  public deleteFolder = wrapFireAndThrowError(
    async (ctx: IBaseContext, folderId: string) => {
      await ctx.db.folder.deleteOne({folderId}).exec();
    }
  );

  public saveFolder = wrapFireAndThrowError(
    async (ctx: IBaseContext, folder: IFolder) => {
      const folderDoc = new ctx.db.folder(folder);
      return await folderDoc.save();
    }
  );

  public folderExists = wrapFireAndThrowError(
    async (ctx: IBaseContext, name: string) => {
      return ctx.db.folder.exists({
        name: {$regex: name, $options: 'i'},
      });
    }
  );

  public bulkSaveFolders = wrapFireAndThrowError(
    async (ctx: IBaseContext, folders: IFolder[]) => {
      return await ctx.db.folder.insertMany(folders);
    }
  );
}

export const getFolderDatabaseProvider = singletonFunc(
  () => new FolderDatabaseProvider()
);
