import {Connection, Document, Model, Schema} from 'mongoose';
import {IFile} from '../definitions/file';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const fileSchema = ensureTypeFields<IFile>({
  fileId: {type: String, unique: true, index: true},
  mimetype: {type: String},
  organizationId: {type: String},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  size: {type: Number},
  folderId: {type: String},
  lastUpdatedAt: {type: Date},
  lastUpdatedBy: {type: agentSchema},
  description: {type: String},
  name: {type: String},
  extension: {type: String},
  encoding: {type: String},
  idPath: {type: [String]},
  isPublic: {type: Boolean},
  markedPublicAt: {type: Date},
  markedPublicBy: agentSchema,
  namePath: {type: [String]},
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
