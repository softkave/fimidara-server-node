import {Connection, Document, Model, Schema} from 'mongoose';
import {
  IAssignedPresetPermissionsGroup,
  IPresetPermissionsGroup,
} from '../definitions/presetPermissionsGroup';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

export const assignedPermissionsGroupSchema =
  ensureTypeFields<IAssignedPresetPermissionsGroup>({
    presetId: {type: String},
    assignedAt: {type: Date, default: getDate},
    assignedBy: agentSchema,
    order: {type: Number},
  });

const presetPermissionsSchema = ensureTypeFields<IPresetPermissionsGroup>({
  resourceId: {type: String},
  organizationId: {type: String},
  createdAt: {type: Date, default: getDate},
  createdBy: agentSchema,
  lastUpdatedAt: {type: Date},
  lastUpdatedBy: agentSchema,
  name: {type: String},
  description: {type: String},
  presets: assignedPermissionsGroupSchema,
});

export type IPresetPermissionsItemDocument = Document<IPresetPermissionsGroup>;

const schema = new Schema<IPresetPermissionsGroup>(presetPermissionsSchema);
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
