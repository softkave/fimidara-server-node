import {IFile} from '../../definitions/file';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {FileDoesNotExistError} from '../files/errors';
import {IBaseContext} from './BaseContext';

export interface IFileContext {
    getFileById: (ctx: IBaseContext, fileId: string) => Promise<IFile | null>;
    assertGetFileById: (ctx: IBaseContext, fileId: string) => Promise<IFile>;
    assertFileById: (ctx: IBaseContext, fileId: string) => Promise<boolean>;
    updateFileById: (
        ctx: IBaseContext,
        fileId: string,
        data: Partial<IFile>
    ) => Promise<IFile | null>;
    saveFile: (ctx: IBaseContext, file: IFile) => Promise<IFile>;
    deleteFile: (ctx: IBaseContext, fileId: string) => Promise<void>;
}

export default class FileContext implements IFileContext {
    public getFileById = wrapFireAndThrowError(
        (ctx: IBaseContext, fileId: string) => {
            return ctx.db.file
                .findOne({
                    fileId,
                })
                .lean()
                .exec();
        }
    );

    public assertGetFileById = wrapFireAndThrowError(
        async (ctx: IBaseContext, fileId: string) => {
            const file = await ctx.file.getFileById(ctx, fileId);

            if (!file) {
                throw new FileDoesNotExistError();
            }

            return file;
        }
    );

    public assertFileById = wrapFireAndThrowError(
        async (ctx: IBaseContext, fileId: string) => {
            const exists = await ctx.db.file.exists({
                fileId,
            });

            if (!exists) {
                throw new FileDoesNotExistError();
            }

            return exists;
        }
    );

    public updateFileById = wrapFireAndThrowError(
        (ctx: IBaseContext, fileId: string, data: Partial<IFile>) => {
            return ctx.db.file
                .findOneAndUpdate({fileId}, data, {
                    new: true,
                })
                .lean()
                .exec();
        }
    );

    public deleteFile = wrapFireAndThrowError(
        async (ctx: IBaseContext, fileId: string) => {
            await ctx.db.file.deleteOne({fileId}).exec();
        }
    );

    public saveFile = wrapFireAndThrowError(
        async (ctx: IBaseContext, file: IFile) => {
            const fileDoc = new ctx.db.file(file);
            return await fileDoc.save();
        }
    );
}

export const getFileContext = singletonFunc(() => new FileContext());
