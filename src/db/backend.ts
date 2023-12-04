import {Connection, Document, Model, Schema} from 'mongoose';
import {FileBackendConfig, FileBackendMount} from '../definitions/fileBackend';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const fileBackendMountSchema = ensureMongoTypeFields<FileBackendMount>({
  ...workspaceResourceSchema,
  folderpath: {type: [String]},
  index: {type: Number},
  mountedFrom: {type: [String]},
  backend: {type: String},
});

const fileBackendConfigSchema = ensureMongoTypeFields<FileBackendConfig>({
  ...workspaceResourceSchema,
  backend: {type: String},
  credentials: {type: String},
  mounts: {type: [fileBackendMountSchema]},
});

export type FileBackendConfigDocument = Document<FileBackendConfig>;

const schema = new Schema<FileBackendConfig>(fileBackendConfigSchema);
const modelName = 'file-backend-config';
const collectionName = 'file-backend-configs';

export function getFileBackendConfigModel(connection: Connection) {
  return connection.model<FileBackendConfig>(modelName, schema, collectionName);
}

export type FileBackendConfigModel = Model<FileBackendConfig>;
