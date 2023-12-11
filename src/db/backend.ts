import {Connection, Document, Model, Schema} from 'mongoose';
import {
  FileBackendConfig,
  FileBackendMount,
  ResolvedMountEntry,
} from '../definitions/fileBackend';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const fileBackendConfigSchema = ensureMongoTypeFields<FileBackendConfig>({
  ...workspaceResourceSchema,
  backend: {type: String},
  secretId: {type: String},
  description: {type: String},
  name: {type: String},
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
  folderpath: {type: [String], index: true},
  index: {type: Number},
  mountedFrom: {type: [String]},
  backend: {type: String},
  configId: {type: String},
  description: {type: String},
  name: {type: String},
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
  mountId: {type: String},
  resolvedAt: {type: Number},
});

const resolvedEntrySchema = new Schema<ResolvedMountEntry>(resolvedMountEntrySchema);
const resolvedEntryModelName = 'file-backend-mount';
const resolvedEntryCollectionName = 'file-backend-mounts';

export function getResolvedMountEntryModel(connection: Connection) {
  return connection.model<ResolvedMountEntry>(
    resolvedEntryModelName,
    resolvedEntrySchema,
    resolvedEntryCollectionName
  );
}

export type ResolvedMountEntryDocument = Document<ResolvedMountEntry>;
export type ResolvedMountEntryModel = Model<ResolvedMountEntry>;
