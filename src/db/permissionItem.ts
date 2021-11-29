import {Connection, Document, Model, Schema} from 'mongoose';
import {IPermissionItem} from '../definitions/permissionItem';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const permissionItemSchema = ensureTypeFields<IPermissionItem>({
  itemId: {type: String, index: true, unique: true},
  organizationId: {type: String},
  createdAt: {type: Date, default: getDate},
  createdBy: agentSchema,
  permissionOwnerId: {type: String},
  permissionOwnerType: {type: String},
  permissionEntityId: {type: String},
  permissionEntityType: {type: String},
  resourceId: {type: String},
  resourceType: {type: String},
  action: {type: String},
  isExclusion: {type: Boolean},
  isForPermissionOwnerOnly: {type: Boolean},
});

export interface IPermissionItemDocument extends Document, IPermissionItem {}

const schema = new Schema<IPermissionItemDocument>(permissionItemSchema);
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
