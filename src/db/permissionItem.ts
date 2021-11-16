import {Connection, Document, Model, Schema} from 'mongoose';
import {IPermissionItem} from '../definitions/permissionItem';
import {ensureTypeFields} from './utils';

const permissionItemSchema = ensureTypeFields<IPermissionItem>({});

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
