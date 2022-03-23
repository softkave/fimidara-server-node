import {Connection, Document, Model, Schema} from 'mongoose';
import {IClientAssignedToken} from '../definitions/clientAssignedToken';
import {getDate} from '../utilities/dateFns';
import {assignedPermissionsGroupSchema} from './presetPermissionsGroup';
import {agentSchema, ensureTypeFields} from './utils';

const clientAssignedTokenSchema = ensureTypeFields<IClientAssignedToken>({
  resourceId: {type: String, unique: true, index: true},
  providedResourceId: {type: String},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  organizationId: {type: String},
  version: {type: Number},
  issuedAt: {type: Date, default: getDate},
  expires: {type: Date},
  lastUpdatedAt: {type: Date},
  lastUpdatedBy: {type: agentSchema},
  presets: {type: [assignedPermissionsGroupSchema], default: []},
});

export type IClientAssignedTokenDocument = Document<IClientAssignedToken>;

const schema = new Schema<IClientAssignedToken>(clientAssignedTokenSchema);
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
