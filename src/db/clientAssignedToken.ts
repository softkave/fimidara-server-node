import {Connection, Document, Model, Schema} from 'mongoose';
import {IClientAssignedToken} from '../definitions/clientAssignedToken';
import {ensureTypeFields, workspaceResourceSchema} from './utils';

const clientAssignedTokenSchema = ensureTypeFields<IClientAssignedToken>({
  ...workspaceResourceSchema,
  name: {type: String, index: true},
  version: {type: Number},
  expires: {type: Number},
  description: {type: String},
});

export type IClientAssignedTokenDocument = Document<IClientAssignedToken>;

const schema = new Schema<IClientAssignedToken>(clientAssignedTokenSchema);
const modelName = 'client-assigned-token';
const collectionName = 'client-assigned-tokens';

export function getClientAssignedTokenModel(connection: Connection) {
  const model = connection.model<IClientAssignedToken>(modelName, schema, collectionName);

  return model;
}

export type IClientAssignedTokenModel = Model<IClientAssignedToken>;
