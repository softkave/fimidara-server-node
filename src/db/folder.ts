import {Connection, Document, Model, Schema} from 'mongoose';
import {Folder} from '../definitions/folder.js';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils.js';

const folderSchema = ensureMongoTypeFields<Folder>({
  ...workspaceResourceSchema,
  idPath: {type: [String], index: true},
  namepath: {type: [String], index: true},
  parentId: {type: String, index: true},
  name: {type: String, index: true},
  description: {type: String},
});

export type FolderDocument = Document<Folder>;

const schema = new Schema<Folder>(folderSchema);
const modelName = 'folder';
const collectionName = 'folders';

export function getFolderDatabaseModel(connection: Connection) {
  const model = connection.model<Folder>(modelName, schema, collectionName);
  return model;
}

export type FolderDatabaseModel = Model<Folder>;
