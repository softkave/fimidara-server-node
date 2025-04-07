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
  clientMultipartId: {type: String},
  internalMultipartId: {type: String},
  multipartTimeout: {type: Number},
});

export type FileDocument = Document<File>;

const schema = new Schema<File>(fileSchema);
const modelName = 'file';
const collectionName = 'files';

export function getFileModel(connection: Connection) {
  const model = connection.model<File>(modelName, schema, collectionName);
  return model;
}

export type FileModel = Model<File>;

const filePartSchemaDefinition = ensureMongoTypeFields<FilePart>({
  ...workspaceResourceSchema,
  multipartId: {type: String, index: true},
  part: {type: Number, index: true},
  size: {type: Number},
  partId: {type: String, index: true},
  fileId: {type: String, index: true},
});

export type FilePartDocument = Document<FilePart>;

const filePartSchema = new Schema<FilePart>(filePartSchemaDefinition);
const filePartModelName = 'file-part';
const filePartCollectionName = 'file-parts';

export function getFilePartMongoModel(connection: Connection) {
  const model = connection.model<FilePart>(
    filePartModelName,
    filePartSchema,
    filePartCollectionName
  );
  return model;
}

export type FilePartMongoModel = Model<FilePart>;
