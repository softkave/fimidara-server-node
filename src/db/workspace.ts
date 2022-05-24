import {Connection, Document, Model, Schema} from 'mongoose';
import {
  ITotalUsageThreshold,
  IUsageThresholdByLabel,
  IWorkspace,
} from '../definitions/workspace';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const totalUsageThresholdSchema = ensureTypeFields<ITotalUsageThreshold>({
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  price: {type: Number},
});

const usageThresholdSchema = ensureTypeFields<IUsageThresholdByLabel>({
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  label: {type: String},
  usage: {type: Number},
  price: {type: Number},
  pricePerUnit: {type: Number},
});

const workspaceSchema = ensureTypeFields<IWorkspace>({
  resourceId: {type: String, unique: true, index: true},
  name: {type: String, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  description: {type: String},
  publicPresetId: {type: String},
  usageStatusAssignedAt: {type: Date},
  usageStatus: {type: Number},
  totalUsageThreshold: {type: totalUsageThresholdSchema},
  usageThresholds: {type: [usageThresholdSchema]},
});

export type IWorkspaceDocument = Document<IWorkspace>;

const schema = new Schema<IWorkspace>(workspaceSchema);
const modelName = 'workspace';
const collectionName = 'workspaces';

export function getWorkspaceModel(connection: Connection) {
  const model = connection.model<IWorkspace>(modelName, schema, collectionName);
  return model;
}

export type IWorkspaceModel = Model<IWorkspace>;
