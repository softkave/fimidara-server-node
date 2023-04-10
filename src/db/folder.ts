import {Connection, Document, Model, Schema} from 'mongoose';
import {IFolder} from '../definitions/folder';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const folderSchema = ensureMongoTypeFields<IFolder>({
  ...workspaceResourceSchema,
  idPath: {type: [String], default: [], index: true},
  namePath: {type: [String], default: [], index: true},
  parentId: {type: String, index: true},
  name: {type: String, index: true},
  description: {type: String},
});

export type IFolderDocument = Document<IFolder>;

const schema = new Schema<IFolder>(folderSchema);
const modelName = 'folder';
const collectionName = 'folders';

export function getFolderDatabaseModel(connection: Connection) {
  const model = connection.model<IFolder>(modelName, schema, collectionName);
  return model;
}

export type IFolderDatabaseModel = Model<IFolder>;
