import {Connection, Document, Model, Schema} from 'mongoose';
import {IFile} from '../definitions/file';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const fileSchema = ensureTypeFields<IFile>({
  resourceId: {type: String, unique: true, index: true},
  idPath: {type: [String], default: [], index: true},
  namePath: {type: [String], default: [], index: true},
  workspaceId: {type: String, index: true},
  folderId: {type: String, index: true},
  name: {type: String, index: true},
  extension: {type: String, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  size: {type: Number},
  lastUpdatedAt: {type: Date},
  lastUpdatedBy: {type: agentSchema},
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
