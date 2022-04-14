import {Connection, Document, Model, Schema} from 'mongoose';
import {IPermissionItem} from '../definitions/permissionItem';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const permissionItemSchema = ensureTypeFields<IPermissionItem>({
  resourceId: {type: String, index: true, unique: true},
  workspaceId: {type: String, index: true},
  permissionOwnerId: {type: String, index: true},
  permissionOwnerType: {type: String, index: true},
  permissionEntityId: {type: String, index: true},
  permissionEntityType: {type: String, index: true},
  itemResourceId: {type: String, index: true},
  itemResourceType: {type: String, index: true},
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
  const model = connection.model<IPermissionItemDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IPermissionItemModel = Model<IPermissionItemDocument>;
