import {Connection, Document, Model, Schema} from 'mongoose';
import {UsageRecordCategory} from '../definitions/usageRecord';
import {UsageThreshold, UsageThresholdLock, Workspace} from '../definitions/workspace';
import {getTimestamp} from '../utils/dateFns';
import {agentSchema, ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const usageThresholdSchema = ensureMongoTypeFields<UsageThreshold>({
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Number, default: getTimestamp},
  category: {type: String},
  budget: {type: Number},
});

const usageThresholdMapSchema = ensureMongoTypeFields<Record<UsageRecordCategory, UsageThreshold>>({
  [UsageRecordCategory.Storage]: {type: usageThresholdSchema},
  // [UsageRecordCategory.Request]: {type: usageThresholdSchema},
  // [UsageRecordCategory.DatabaseObject]: {type: usageThresholdSchema},
  [UsageRecordCategory.BandwidthIn]: {type: usageThresholdSchema},
  [UsageRecordCategory.BandwidthOut]: {type: usageThresholdSchema},
  [UsageRecordCategory.Total]: {type: usageThresholdSchema},
});

const usageThresholdLockSchema = ensureMongoTypeFields<UsageThresholdLock>({
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Number, default: getTimestamp},
  category: {type: String},
  locked: {type: Boolean},
});

const usageThresholdLockMapSchema = ensureMongoTypeFields<
  Record<UsageRecordCategory, UsageThreshold>
>({
  [UsageRecordCategory.Storage]: {type: usageThresholdLockSchema},
  // [UsageRecordCategory.Request]: {type: usageThresholdLockSchema},
  // [UsageRecordCategory.DatabaseObject]: {type: usageThresholdLockSchema},
  [UsageRecordCategory.BandwidthIn]: {type: usageThresholdLockSchema},
  [UsageRecordCategory.BandwidthOut]: {type: usageThresholdLockSchema},
  [UsageRecordCategory.Total]: {type: usageThresholdLockSchema},
});

const workspaceSchema = ensureMongoTypeFields<Workspace>({
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
    // of: new Schema<UsageThreshold>(usageThresholdSchema),
  },
  usageThresholdLocks: {
    type: usageThresholdLockMapSchema,
    default: {},
    // of: new Schema<UsageThreshold>(usageThresholdLockSchema),
  },
});

export type WorkspaceDocument = Document<Workspace>;

const schema = new Schema<Workspace>(workspaceSchema);
const modelName = 'workspace';
const collectionName = 'workspaces';

export function getWorkspaceModel(connection: Connection) {
  const model = connection.model<Workspace>(modelName, schema, collectionName);
  return model;
}

export type WorkspaceModel = Model<Workspace>;
