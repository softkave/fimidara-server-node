import {Connection, Document, Model, Schema} from 'mongoose';
import {ICollaborationRequest} from '../definitions/collaborationRequest';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const collaborationRequestStatusHistorySchema = {
  status: {type: String},
  date: {type: Date},
};

const collaborationRequestSchema = ensureTypeFields<ICollaborationRequest>({
  resourceId: {type: String, unique: true, index: true},
  recipientEmail: {type: String, index: true},
  message: {type: String},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: () => getDate()},
  expiresAt: {type: Date},
  readAt: {type: Date},
  statusHistory: {
    type: [collaborationRequestStatusHistorySchema],
    default: [],
  },
  organizationId: {type: String, index: true},
  organizationName: {type: String},
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
});

export type ICollaborationRequestDocument = Document<ICollaborationRequest>;

const schema = new Schema<ICollaborationRequest>(collaborationRequestSchema);
const modelName = 'collaboration-request';
const collectionName = 'collaboration-requests';

export function getCollaborationRequestModel(connection: Connection) {
  const model = connection.model<ICollaborationRequestDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type ICollaborationRequestModel = Model<ICollaborationRequestDocument>;
