import {Connection, Document, Model, Schema} from 'mongoose';
import {IPresetPermissionsItem} from '../definitions/presetPermissionsItem';
import {ensureTypeFields} from './utils';

const presetPermissionsSchema = ensureTypeFields<IPresetPermissionsItem>({});

export interface IPresetPermissionsItemDocument
  extends Document,
    IPresetPermissionsItem {}

const schema = new Schema<IPresetPermissionsItemDocument>(
  presetPermissionsSchema
);
const modelName = 'preset-permissions-item';
const collectionName = 'preset-permissions-items';

export function getPresetPermissionsModel(connection: Connection) {
  const model = connection.model<IPresetPermissionsItemDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IPresetPermissionsItemModel = Model<IPresetPermissionsItemDocument>;
