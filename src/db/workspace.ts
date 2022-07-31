import {Connection, Document, Model, Schema} from 'mongoose';
import {UsageRecordCategory} from '../definitions/usageRecord';
import {
  IUsageThreshold,
  IUsageThresholdLock,
  IWorkspace,
} from '../definitions/workspace';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const usageThresholdSchema = ensureTypeFields<IUsageThreshold>({
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date, default: getDate},
  category: {type: String},
  price: {type: Number},
});

const usageThresholdMapSchema = ensureTypeFields<
  Record<UsageRecordCategory, IUsageThreshold>
>({
  [UsageRecordCategory.Storage]: {type: usageThresholdSchema},
  [UsageRecordCategory.Request]: {type: usageThresholdSchema},
  [UsageRecordCategory.BandwidthIn]: {type: usageThresholdSchema},
  [UsageRecordCategory.BandwidthOut]: {type: usageThresholdSchema},
  [UsageRecordCategory.DatabaseObject]: {type: usageThresholdSchema},
  [UsageRecordCategory.Total]: {type: usageThresholdSchema},
});

const usageThresholdLockSchema = ensureTypeFields<IUsageThresholdLock>({
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date, default: getDate},
  category: {type: String},
  locked: {type: Boolean},
});

const usageThresholdLockMapSchema = ensureTypeFields<
  Record<UsageRecordCategory, IUsageThreshold>
>({
  [UsageRecordCategory.Storage]: {type: usageThresholdLockSchema},
  [UsageRecordCategory.Request]: {type: usageThresholdLockSchema},
  [UsageRecordCategory.BandwidthIn]: {type: usageThresholdLockSchema},
  [UsageRecordCategory.BandwidthOut]: {type: usageThresholdLockSchema},
  [UsageRecordCategory.DatabaseObject]: {type: usageThresholdLockSchema},
  [UsageRecordCategory.Total]: {type: usageThresholdLockSchema},
});

const workspaceSchema = ensureTypeFields<IWorkspace>({
  resourceId: {type: String, unique: true, index: true},
  name: {type: String, index: true},
  rootname: {type: String, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  description: {type: String},
  publicPermissionGroupId: {type: String},
  billStatusAssignedAt: {type: Date},
  billStatus: {type: Number},
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
