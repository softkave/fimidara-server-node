import {Connection, Document, Model, Schema} from 'mongoose';
import {IFile, IFileCreator} from '../definitions/file';
import {getDate} from '../utilities/dateFns';
import {ensureTypeFields} from './utils';

const fileCreatorSchema = ensureTypeFields<IFileCreator>({
    createdBy: {type: String},
    type: {type: String},
});

const fileSchema = ensureTypeFields<IFile>({
    fileId: {type: String, unique: true, index: true},
    mimetype: {type: String},
    organizationId: {type: String},
    createdBy: {type: [fileCreatorSchema]},
    createdAt: {type: Date, default: getDate},
    size: {type: Number},
    environmentId: {type: String},
    projectId: {type: String},
    bucketId: {type: String},
    originalFileId: {type: String},
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
