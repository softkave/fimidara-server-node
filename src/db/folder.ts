import {Connection, Document, Model, Schema} from 'mongoose';
import {IFolder} from '../definitions/folder';
import {getDate} from '../utils/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const folderSchema = ensureTypeFields<IFolder>({
  resourceId: {type: String, unique: true, index: true},
  workspaceId: {type: String, index: true},
  idPath: {type: [String], default: [], index: true},
  namePath: {type: [String], default: [], index: true},
  parentId: {type: String, index: true},
  name: {type: String, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  lastUpdatedAt: {type: Date},
  lastUpdatedBy: {type: agentSchema},
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
