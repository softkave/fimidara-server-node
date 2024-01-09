import {Connection, Document, Model, Schema} from 'mongoose';
import {FilePresignedPath} from '../definitions/file';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const filePresignedPathSchema = ensureMongoTypeFields<FilePresignedPath>({
  ...workspaceResourceSchema,
  fileId: {type: String, index: true},
  namepath: {type: [String], index: true},
  actions: {type: [String], index: true},
  extension: {type: String, index: true},
  maxUsageCount: {type: Number},
  expiresAt: {type: Date},
  spentUsageCount: {type: Number},
  issuerAgentTokenId: {type: String, index: true},
});

export type FilePresignedPathDocument = Document<FilePresignedPath>;

const schema = new Schema<FilePresignedPath>(filePresignedPathSchema);
const modelName = 'file-presigned-path';
const collectionName = 'file-presigned-paths';

export function getFilePresignedPathMongoModel(connection: Connection) {
  const model = connection.model<FilePresignedPath>(modelName, schema, collectionName);
  return model;
}

export type FilePresignedPathMongoModel = Model<FilePresignedPath>;
