import {Connection, Document, Model, Schema} from 'mongoose';
import {IPermissionItem} from '../definitions/permissionItem';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const permissionItemSchema = ensureTypeFields<IPermissionItem>({
  resourceId: {type: String, index: true, unique: true},
  organizationId: {type: String},
  createdAt: {type: Date, default: getDate},
  createdBy: agentSchema,
  permissionOwnerId: {type: String},
  permissionOwnerType: {type: String},
  permissionEntityId: {type: String},
  permissionEntityType: {type: String},
  itemResourceId: {type: String},
  itemResourceType: {type: String},
  action: {type: String},
  isExclusion: {type: Boolean},
  isForPermissionOwnerOnly: {type: Boolean},
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
