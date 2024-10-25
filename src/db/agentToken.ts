import {Connection, Document, Model, Schema} from 'mongoose';
import {AgentToken} from '../definitions/agentToken.js';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils.js';

const agentTokenSchema = ensureMongoTypeFields<AgentToken>({
  ...workspaceResourceSchema,
  name: {type: String, index: true},
  forEntityId: {type: String, index: true},
  entityType: {type: String, index: true},
  workspaceId: {type: String, index: true},
  providedResourceId: {type: String, index: true},
  version: {type: Number},
  expiresAt: {type: Number},
  description: {type: String},
  scope: {type: [String], index: true},
  shouldRefresh: {type: Boolean},
  refreshDuration: {type: Number},
});

export type AgentTokenDocument = Document<AgentToken>;

const schema = new Schema<AgentToken>(agentTokenSchema);
const modelName = 'agent-token';
const collectionName = 'agent-tokens';

export function getAgentTokenModel(connection: Connection) {
  const model = connection.model<AgentToken>(modelName, schema, collectionName);
  return model;
}

export type AgentTokenModel = Model<AgentToken>;
