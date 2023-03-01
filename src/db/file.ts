import {Connection, Document, Model, Schema} from 'mongoose';
import {IFile} from '../definitions/file';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const fileSchema = ensureMongoTypeFields<IFile>({
  ...workspaceResourceSchema,
  idPath: {type: [String], default: [], index: true},
  namePath: {type: [String], default: [], index: true},
  folderId: {type: String, index: true},
  name: {type: String, index: true},
  extension: {type: String, index: true},
  size: {type: Number},
  description: {type: String},
  encoding: {type: String},
  mimetype: {type: String},
});

export type IFileDocument = Document<IFile>;

const schema = new Schema<IFile>(fileSchema);
const modelName = 'file';
const collectionName = 'files';

export function getFileModel(connection: Connection) {
  const model = connection.model<IFile>(modelName, schema, collectionName);
  return model;
}

export type IFileModel = Model<IFile>;
