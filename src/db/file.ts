import {Connection, Document, Model, Schema} from 'mongoose';
import {IFile} from '../definitions/file';
import {IBaseContext} from '../endpoints/BaseContext';
import {FileDoesNotExistError} from '../endpoints/files/errors';
import {getDate} from '../utilities/dateFns';
import {wrapFireAndThrowError} from '../utilities/promiseFns';
import singletonFunc from '../utilities/singletonFunc';
import {ensureTypeFields} from './utils';

const fileSchema = ensureTypeFields<IFile>({
    fileId: {type: String, unique: true, index: true},
    URL: {type: String},
    mimetype: {type: String},
    imageSizeOptions: {
        width: {type: Number},
        height: {type: Number},
        size: {type: Number},
    },
    organizationId: {type: String},
    createdBy: {type: String},
    createdAt: {type: Date, default: getDate},
    lastUpdatedBy: {type: String},
    lastUpdatedAt: {type: Date},
    size: {type: Number},
});

export interface IFileDocument extends Document, IFile {}

const schema = new Schema<IFileDocument>(fileSchema);
const modelName = 'file';
const collectionName = 'files';

export function getFileModel(connection: Connection) {
    const model = connection.model<IFileDocument>(
        modelName,
        schema,
        collectionName
    );

    return model;
}

export type IFileModel = Model<IFileDocument>;

export interface IFileDbHelpers {
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

export default class FileDbHelpers implements IFileDbHelpers {
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

export const getFileDbHelpers = singletonFunc(() => new FileDbHelpers());
