import {Connection, Document, Model, Schema} from 'mongoose';
import {File, FilePart} from '../definitions/file.js';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils.js';

const fileSchema = ensureMongoTypeFields<File>({
  ...workspaceResourceSchema,
  idPath: {type: [String], index: true},
  namepath: {type: [String], index: true},
  ext: {type: String, index: true},
  parentId: {type: String, index: true},
  name: {type: String, index: true},
  size: {type: Number},
  description: {type: String},
  encoding: {type: String},
  mimetype: {type: String},
  isReadAvailable: {type: Boolean},
  isWriteAvailable: {type: Boolean},
  version: {type: Number},
  multipartId: {type: String},
  multipartTimeout: {type: Number},
});

export type FileDocument = Document<File>;

const fileMongoSchema = new Schema<File>(fileSchema);
const fileModelName = 'file';
const fileCollectionName = 'files';

export function getFileModel(connection: Connection) {
  const model = connection.model<File>(
    fileModelName,
    fileMongoSchema,
    fileCollectionName
  );
  return model;
}

export type FileModel = Model<File>;

const filePartSchema = ensureMongoTypeFields<FilePart>({
  ...workspaceResourceSchema,
  multipartId: {type: String, index: true},
  fileId: {type: String, index: true},
  part: {type: Number},
  size: {type: Number},
  partId: {type: String},
});

export type FilePartDocument = Document<FilePart>;

const filePartMongoSchema = new Schema<FilePart>(filePartSchema);
const filePartModelName = 'filePart';
const filePartCollectionName = 'fileParts';

export function getFilePartModel(connection: Connection) {
  const model = connection.model<FilePart>(
    filePartModelName,
    filePartMongoSchema,
    filePartCollectionName
  );
  return model;
}

export type FilePartModel = Model<FilePart>;
