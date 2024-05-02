import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {
  FileBackendConfig,
  FileBackendMount,
  ResolvedMountEntry,
} from '../definitions/fileBackend.js';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils.js';

const fileBackendConfigSchema = ensureMongoTypeFields<FileBackendConfig>({
  ...workspaceResourceSchema,
  backend: {type: String, index: true},
  secretId: {type: String, index: true},
  description: {type: String},
  name: {type: String, index: true},
});

const configSchema = new Schema<FileBackendConfig>(fileBackendConfigSchema);
const configModelName = 'file-backend-config';
const configCollectionName = 'file-backend-configs';

export function getFileBackendConfigModel(connection: Connection) {
  return connection.model<FileBackendConfig>(
    configModelName,
    configSchema,
    configCollectionName
  );
}

export type FileBackendConfigDocument = Document<FileBackendConfig>;
export type FileBackendConfigModel = Model<FileBackendConfig>;

const fileBackendMountSchema = ensureMongoTypeFields<FileBackendMount>({
  ...workspaceResourceSchema,
  namepath: {type: [String], index: true},
  index: {type: Number, index: true},
  mountedFrom: {type: [String], index: true},
  backend: {type: String, index: true},
  configId: {type: String, index: true},
  description: {type: String},
  name: {type: String, index: true},
});

const mountSchema = new Schema<FileBackendMount>(fileBackendMountSchema);
const mountModelName = 'file-backend-mount';
const mountCollectionName = 'file-backend-mounts';

export function getFileBackendMountModel(connection: Connection) {
  return connection.model<FileBackendMount>(
    mountModelName,
    mountSchema,
    mountCollectionName
  );
}

export type FileBackendMountDocument = Document<FileBackendMount>;
export type FileBackendMountModel = Model<FileBackendMount>;

const resolvedMountEntrySchema = ensureMongoTypeFields<ResolvedMountEntry>({
  ...workspaceResourceSchema,
  mountId: {type: String, index: true},
  backendNamepath: {type: [String], index: true},
  backendExt: {type: String, index: true},
  fimidaraNamepath: {type: [String], index: true},
  fimidaraExt: {type: String, index: true},
  forId: {type: String, index: true},
  forType: {type: String, index: true},
  persisted: {type: SchemaTypes.Map},
});

const resolvedEntrySchema = new Schema<ResolvedMountEntry>(resolvedMountEntrySchema);
const resolvedEntryModelName = 'resolved-mount-entry';
const resolvedEntryCollectionName = 'resolved-mount-entries';

export function getResolvedMountEntryModel(connection: Connection) {
  return connection.model<ResolvedMountEntry>(
    resolvedEntryModelName,
    resolvedEntrySchema,
    resolvedEntryCollectionName
  );
}

export type ResolvedMountEntryDocument = Document<ResolvedMountEntry>;
export type ResolvedMountEntryModel = Model<ResolvedMountEntry>;
