import {Connection, Document, Model, Schema} from 'mongoose';
import {IPresetPermissionsGroup} from '../definitions/presetPermissionsGroup';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const presetPermissionsSchema = ensureTypeFields<IPresetPermissionsGroup>({
  resourceId: {type: String, unique: true, index: true},
  workspaceId: {type: String, index: true},
  name: {type: String, index: true},
  createdAt: {type: Date, default: getDate},
  createdBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  lastUpdatedBy: {type: agentSchema},
  description: {type: String},
});

export type IPresetPermissionsItemDocument = Document<IPresetPermissionsGroup>;

const schema = new Schema<IPresetPermissionsGroup>(presetPermissionsSchema);
const modelName = 'preset-permissions-group';
const collectionName = 'preset-permissions-groups';

export function getPresetPermissionsModel(connection: Connection) {
  const model = connection.model<IPresetPermissionsItemDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IPresetPermissionsItemModel = Model<IPresetPermissionsItemDocument>;
