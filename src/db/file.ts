import {Connection, Document, Model, Schema} from 'mongoose';
import {File} from '../definitions/file';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const fileSchema = ensureMongoTypeFields<File>({
  ...workspaceResourceSchema,
  idPath: {type: [String], default: [], index: true},
  namePath: {type: [String], default: [], index: true},
  parentId: {type: String, index: true},
  name: {type: String, index: true},
  extension: {type: String, index: true},
  size: {type: Number},
  description: {type: String},
  encoding: {type: String},
  mimetype: {type: String},
});

export type FileDocument = Document<File>;

const schema = new Schema<File>(fileSchema);
const modelName = 'file';
const collectionName = 'files';

export function getFileModel(connection: Connection) {
  const model = connection.model<File>(modelName, schema, collectionName);
  return model;
}

export type FileModel = Model<File>;
