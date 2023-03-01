import {Connection, Document, Model, Schema} from 'mongoose';
import {IAgentToken} from '../definitions/agentToken10';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const agentTokenSchema = ensureMongoTypeFields<IAgentToken>({
  ...workspaceResourceSchema,
  name: {type: String, index: true},
  version: {type: Number},
  expires: {type: Number},
  description: {type: String},
  tokenFor: {type: [String]},
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
