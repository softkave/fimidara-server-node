import {Connection, Document, Model, Schema} from 'mongoose';
import {IFolder} from '../definitions/folder';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const folderSchema = ensureTypeFields<IFolder>({
  resourceId: {type: String, unique: true, index: true},
  organizationId: {type: String},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  maxFileSizeInBytes: {type: Number},
  lastUpdatedAt: {type: Date},
  lastUpdatedBy: {type: agentSchema},
  parentId: {type: String},
  name: {type: String, index: true},
  description: {type: String},
  idPath: {type: [String], default: []},
  namePath: {type: [String], default: []},
});

export type IFolderDocument = Document<IFolder>;

const schema = new Schema<IFolder>(folderSchema);
const modelName = 'folder';
const collectionName = 'folders';

export function getFolderDatabaseModel(connection: Connection) {
  const model = connection.model<IFolderDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IFolderDatabaseModel = Model<IFolderDocument>;
