import {Connection, Document, Model, Schema} from 'mongoose';
import {IClientAssignedToken} from '../definitions/clientAssignedToken';
import {getDate} from '../utilities/dateFns';
import {assignedPermissionsGroupSchema} from './presetPermissionsGroup';
import {agentSchema, ensureTypeFields} from './utils';

const clientAssignedTokenSchema = ensureTypeFields<IClientAssignedToken>({
  tokenId: {type: String, unique: true, index: true},
  createdBy: {type: String},
  createdAt: {type: Date, default: getDate},
  organizationId: {type: String},
  version: {type: Number},
  issuedAt: {type: String},
  expires: {type: Number},
  lastUpdatedAt: {type: Date, default: getDate},
  lastUpdatedBy: agentSchema,
  presets: {type: [assignedPermissionsGroupSchema]},
});

export type IClientAssignedTokenDocument = Document<IClientAssignedToken>;

const schema = new Schema<IClientAssignedTokenDocument>(
  clientAssignedTokenSchema
);
const modelName = 'client-assigned-token';
const collectionName = 'client-assigned-tokens';

export function getClientAssignedTokenModel(connection: Connection) {
  const model = connection.model<IClientAssignedTokenDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IClientAssignedTokenModel = Model<IClientAssignedTokenDocument>;
