import {Connection, Document, Model, Schema} from 'mongoose';
import {PresignedPath} from '../definitions/presignedPath.js';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils.js';

const presignedPathSchema = ensureMongoTypeFields<PresignedPath>({
  ...workspaceResourceSchema,
  fileId: {type: String, index: true},
  namepath: {type: [String], index: true},
  actions: {type: [String], index: true},
  ext: {type: String, index: true},
  maxUsageCount: {type: Number},
  expiresAt: {type: Date},
  spentUsageCount: {type: Number},
  issuerAgentTokenId: {type: String, index: true},
});

export type PresignedPathDocument = Document<PresignedPath>;

const schema = new Schema<PresignedPath>(presignedPathSchema);
const modelName = 'presigned-path';
const collectionName = 'presigned-paths';

export function getPresignedPathMongoModel(connection: Connection) {
  const model = connection.model<PresignedPath>(modelName, schema, collectionName);
  return model;
}

export type PresignedPathMongoModel = Model<PresignedPath>;
