import {Connection, Document, Model, Schema} from 'mongoose';
import {PermissionGroup} from '../definitions/permissionGroups.js';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils.js';

const permissionGroupsSchema = ensureMongoTypeFields<PermissionGroup>({
  ...workspaceResourceSchema,
  name: {type: String, index: true},
  description: {type: String},
});

export type PermissionGroupDocument = Document<PermissionGroup>;

const schema = new Schema<PermissionGroup>(permissionGroupsSchema);
const modelName = 'permission-group';
const collectionName = 'permission-groups';

export function getPermissionGroupModel(connection: Connection) {
  const model = connection.model<PermissionGroup>(modelName, schema, collectionName);
  return model;
}

export type PermissionGroupMongoModel = Model<PermissionGroup>;
