import {Connection, Document, Model, Schema} from 'mongoose';
import {PermissionItem} from '../definitions/permissionItem';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const permissionItemSchema = ensureMongoTypeFields<PermissionItem>({
  ...workspaceResourceSchema,
  entityId: {type: String, index: true},
  entityType: {type: String, index: true},
  targetParentId: {type: String, index: true},
  targetParentType: {type: String, index: true},
  targetId: {type: String, index: true},
  targetType: {type: String, index: true},
  grantAccess: {type: Boolean, index: true},
  action: {type: String, index: true},
  appliesTo: {type: String, index: true},
});

export type PermissionItemDocument = Document<PermissionItem>;

const schema = new Schema<PermissionItem>(permissionItemSchema);
const modelName = 'permission-item';
const collectionName = 'permission-items';

export function getPermissionItemModel(connection: Connection) {
  const model = connection.model<PermissionItem>(modelName, schema, collectionName);
  return model;
}

export type PermissionItemModel = Model<PermissionItem>;
