import {Connection, Document, Model, Schema} from 'mongoose';
import {IPermissionItem} from '../definitions/permissionItem';
import {ensureTypeFields, workspaceResourceSchema} from './utils';

const permissionItemSchema = ensureTypeFields<IPermissionItem>({
  ...workspaceResourceSchema,
  containerId: {type: String, index: true},
  containerType: {type: String, index: true},
  entityId: {type: String, index: true},
  entityType: {type: String, index: true},
  targetId: {type: String, index: true},
  targetType: {type: String, index: true},
  grantAccess: {type: Boolean, index: true},
  appliesTo: {type: String, index: true},
  action: {type: String, index: true},
  hash: {type: String, index: true},
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
