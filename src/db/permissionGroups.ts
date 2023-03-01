import {Connection, Document, Model, Schema} from 'mongoose';
import {IPermissionGroup} from '../definitions/permissionGroups';
import {ensureTypeFields, workspaceResourceSchema} from './utils';

const permissionGroupsSchema = ensureTypeFields<IPermissionGroup>({
  ...workspaceResourceSchema,
  name: {type: String, index: true},
  description: {type: String},
});

export type IPermissionGroupDocument = Document<IPermissionGroup>;

const schema = new Schema<IPermissionGroup>(permissionGroupsSchema);
const modelName = 'permission-group';
const collectionName = 'permission-groups';

export function getPermissionGroupModel(connection: Connection) {
  const model = connection.model<IPermissionGroup>(modelName, schema, collectionName);
  return model;
}

export type IPermissionGroupPermissionsItemModel = Model<IPermissionGroup>;
