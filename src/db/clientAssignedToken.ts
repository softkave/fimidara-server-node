import {Connection, Document, Model, Schema} from 'mongoose';
import {IClientAssignedToken} from '../definitions/clientAssignedToken';
import {getDate} from '../utils/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const clientAssignedTokenSchema = ensureTypeFields<IClientAssignedToken>({
  resourceId: {type: String, unique: true, index: true},
  providedResourceId: {type: String, index: true},
  workspaceId: {type: String, index: true},
  name: {type: String, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  version: {type: Number},
  issuedAt: {type: Date, default: getDate},
  expires: {type: Date},
  lastUpdatedAt: {type: Date},
  lastUpdatedBy: {type: agentSchema},
  description: {type: String},
});

export type IClientAssignedTokenDocument = Document<IClientAssignedToken>;

const schema = new Schema<IClientAssignedToken>(clientAssignedTokenSchema);
const modelName = 'client-assigned-token';
const collectionName = 'client-assigned-tokens';

export function getClientAssignedTokenModel(connection: Connection) {
  const model = connection.model<IClientAssignedToken>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IClientAssignedTokenModel = Model<IClientAssignedToken>;
