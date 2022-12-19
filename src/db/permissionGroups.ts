import {Connection, Document, Model, Schema} from 'mongoose';
import {IPermissionGroup} from '../definitions/permissionGroups';
import {getDate} from '../utils/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const permissionGroupsSchema = ensureTypeFields<IPermissionGroup>({
  resourceId: {type: String, unique: true, index: true},
  workspaceId: {type: String, index: true},
  name: {type: String, index: true},
  createdAt: {type: Date, default: getDate},
  createdBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  lastUpdatedBy: {type: agentSchema},
  description: {type: String},
});

export type IPermissionGroupDocument = Document<IPermissionGroup>;

const schema = new Schema<IPermissionGroup>(permissionGroupsSchema);
const modelName = 'permission-group';
const collectionName = 'permission-groups';

export function getPermissionGroupModel(connection: Connection) {
  const model = connection.model<IPermissionGroup>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IPermissionGroupPermissionsItemModel = Model<IPermissionGroup>;
