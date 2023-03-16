import {Connection, Document, Model, Schema} from 'mongoose';
import {IAgentToken} from '../definitions/agentToken';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const agentTokenSchema = ensureMongoTypeFields<IAgentToken>({
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

export type IAgentTokenDocument = Document<IAgentToken>;

const schema = new Schema<IAgentToken>(agentTokenSchema);
const modelName = 'agent-token';
const collectionName = 'agent-tokens';

export function getAgentTokenModel(connection: Connection) {
  const model = connection.model<IAgentToken>(modelName, schema, collectionName);
  return model;
}

export type IAgentTokenModel = Model<IAgentToken>;
