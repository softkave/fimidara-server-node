import {Connection, Document, Model, Schema} from 'mongoose';
import {AgentToken} from '../definitions/agentToken';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const agentTokenSchema = ensureMongoTypeFields<AgentToken>({
  ...workspaceResourceSchema,
  name: {type: String, index: true},
  separateEntityId: {type: String, index: true},
  agentType: {type: String, index: true},
  workspaceId: {type: String, index: true},
  version: {type: Number},
  expires: {type: Number},
  description: {type: String},
  scope: {type: [String], index: true},
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
