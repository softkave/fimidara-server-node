import {Connection, Document, Model, Schema} from 'mongoose';
import {IPermissionItem} from '../definitions/permissionItem';
import {getDate} from '../utils/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const permissionItemSchema = ensureTypeFields<IPermissionItem>({
  resourceId: {type: String, index: true, unique: true},
  workspaceId: {type: String, index: true},
  containerId: {type: String, index: true},
  containerType: {type: String, index: true},
  permissionEntityId: {type: String, index: true},
  permissionEntityType: {type: String, index: true},
  targetId: {type: String, index: true},
  targetType: {type: String, index: true},
  grantAccess: {type: Boolean, index: true},
  appliesTo: {type: String, index: true},
  action: {type: String, index: true},
  hash: {type: String, index: true},
  createdAt: {type: Date, default: getDate},
  createdBy: {type: agentSchema},
});

export type IPermissionItemDocument = Document<IPermissionItem>;

const schema = new Schema<IPermissionItem>(permissionItemSchema);
const modelName = 'permission-item';
const collectionName = 'permission-items';

export function getPermissionItemModel(connection: Connection) {
  const model = connection.model<IPermissionItem>(modelName, schema, collectionName);

  return model;
}

export type IPermissionItemModel = Model<IPermissionItem>;
