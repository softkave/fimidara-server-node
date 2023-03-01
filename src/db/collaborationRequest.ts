import {Connection, Document, Model, Schema} from 'mongoose';
import {ICollaborationRequest} from '../definitions/collaborationRequest';
import {ensureTypeFields, workspaceResourceSchema} from './utils';

const collaborationRequestStatusHistorySchema = {
  status: {type: String},
  date: {type: Date},
};

const collaborationRequestSchema = ensureTypeFields<ICollaborationRequest>({
  ...workspaceResourceSchema,
  recipientEmail: {type: String, index: true},
  workspaceName: {type: String},
  message: {type: String},
  expiresAt: {type: Number},
  readAt: {type: Number},
  statusHistory: {
    type: [collaborationRequestStatusHistorySchema],
    default: [],
  },
});

export type ICollaborationRequestDocument = Document<ICollaborationRequest>;

const schema = new Schema<ICollaborationRequest>(collaborationRequestSchema);
const modelName = 'collaboration-request';
const collectionName = 'collaboration-requests';

export function getCollaborationRequestModel(connection: Connection) {
  const model = connection.model<ICollaborationRequest>(modelName, schema, collectionName);

  return model;
}

export type ICollaborationRequestModel = Model<ICollaborationRequest>;
