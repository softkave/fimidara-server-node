import {Connection, Document, Model, Schema} from 'mongoose';
import {FilePresignedPath} from '../definitions/file';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const filePresignedPathSchema = ensureMongoTypeFields<FilePresignedPath>({
  ...workspaceResourceSchema,
  filepath: {type: [String], default: [], index: true},
  actions: {type: [String], default: [], index: true},
  extension: {type: String, index: true},
  maxUsageCount: {type: Number},
  expiresAt: {type: Date},
  spentUsageCount: {type: Number},
  issueAgentTokenId: {type: String, index: true},
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
