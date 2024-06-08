import {Connection, Document, Model, Schema} from 'mongoose';
import {CollaborationRequest} from '../definitions/collaborationRequest.js';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils.js';

const collaborationRequestSchema = ensureMongoTypeFields<CollaborationRequest>({
  ...workspaceResourceSchema,
  recipientEmail: {type: String, index: true},
  workspaceName: {type: String},
  message: {type: String},
  expiresAt: {type: Number},
  readAt: {type: Number},
  status: {type: String, index: true},
  statusDate: {type: Number},
});

export type CollaborationRequestDocument = Document<CollaborationRequest>;

const schema = new Schema<CollaborationRequest>(collaborationRequestSchema);
const modelName = 'collaboration-request';
const collectionName = 'collaboration-requests';

export function getCollaborationRequestModel(connection: Connection) {
  const model = connection.model<CollaborationRequest>(modelName, schema, collectionName);
  return model;
}

export type CollaborationRequestModel = Model<CollaborationRequest>;
