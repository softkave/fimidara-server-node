import {Connection, Document, Model, Schema} from 'mongoose';
import {FilePresignedPath} from '../definitions/file';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const filePresignedPathSchema = ensureMongoTypeFields<FilePresignedPath>({
  ...workspaceResourceSchema,
  fileNamePath: {type: [String], default: [], index: true},
  action: {type: [String], default: [], index: true},
  fileExtension: {type: String, index: true},
  usageCount: {type: Number},
  expiresAt: {type: Date},
  spentUsageCount: {type: Number},
  agentTokenId: {type: String, index: true},
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