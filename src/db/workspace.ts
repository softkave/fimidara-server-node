import {Connection, Document, Model, Schema} from 'mongoose';
import {UsageRecordCategory} from '../definitions/usageRecord';
import {IUsageThreshold, IUsageThresholdLock, IWorkspace} from '../definitions/workspace';
import {getTimestamp} from '../utils/dateFns';
import {agentSchema, ensureTypeFields, workspaceResourceSchema} from './utils';

const usageThresholdSchema = ensureTypeFields<IUsageThreshold>({
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Number, default: getTimestamp},
  category: {type: String},
  budget: {type: Number},
});

const usageThresholdMapSchema = ensureTypeFields<Record<UsageRecordCategory, IUsageThreshold>>({
  [UsageRecordCategory.Storage]: {type: usageThresholdSchema},
  // [UsageRecordCategory.Request]: {type: usageThresholdSchema},
  // [UsageRecordCategory.DatabaseObject]: {type: usageThresholdSchema},
  [UsageRecordCategory.BandwidthIn]: {type: usageThresholdSchema},
  [UsageRecordCategory.BandwidthOut]: {type: usageThresholdSchema},
  [UsageRecordCategory.Total]: {type: usageThresholdSchema},
});

const usageThresholdLockSchema = ensureTypeFields<IUsageThresholdLock>({
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Number, default: getTimestamp},
  category: {type: String},
  locked: {type: Boolean},
});

const usageThresholdLockMapSchema = ensureTypeFields<Record<UsageRecordCategory, IUsageThreshold>>({
  [UsageRecordCategory.Storage]: {type: usageThresholdLockSchema},
  // [UsageRecordCategory.Request]: {type: usageThresholdLockSchema},
  // [UsageRecordCategory.DatabaseObject]: {type: usageThresholdLockSchema},
  [UsageRecordCategory.BandwidthIn]: {type: usageThresholdLockSchema},
  [UsageRecordCategory.BandwidthOut]: {type: usageThresholdLockSchema},
  [UsageRecordCategory.Total]: {type: usageThresholdLockSchema},
});

const workspaceSchema = ensureTypeFields<IWorkspace>({
  ...workspaceResourceSchema,
  name: {type: String, index: true},
  rootname: {type: String, index: true},
  description: {type: String},
  publicPermissionGroupId: {type: String},
  billStatusAssignedAt: {type: Number},
  billStatus: {type: String},
  usageThresholds: {
    type: usageThresholdMapSchema,
    default: {},
    // of: new Schema<IUsageThreshold>(usageThresholdSchema),
  },
  usageThresholdLocks: {
    type: usageThresholdLockMapSchema,
    default: {},
    // of: new Schema<IUsageThreshold>(usageThresholdLockSchema),
  },
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
