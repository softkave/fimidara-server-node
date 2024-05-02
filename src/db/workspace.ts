import {Connection, Document, Model, Schema} from 'mongoose';
import {UsageRecordCategory, UsageRecordCategoryMap} from '../definitions/usageRecord.js';
import {UsageThreshold, UsageThresholdLock, Workspace} from '../definitions/workspace.js';
import {getTimestamp} from '../utils/dateFns.js';
import {agentSchema, ensureMongoTypeFields, workspaceResourceSchema} from './utils.js';

const usageThresholdSchema = ensureMongoTypeFields<UsageThreshold>({
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Number, default: getTimestamp},
  category: {type: String},
  budget: {type: Number},
});

const usageThresholdMapSchema = ensureMongoTypeFields<
  Record<UsageRecordCategory, UsageThreshold>
>({
  [UsageRecordCategoryMap.Storage]: {type: usageThresholdSchema},
  // [UsageRecordCategoryMap.Request]: {type: usageThresholdSchema},
  // [UsageRecordCategoryMap.DatabaseObject]: {type: usageThresholdSchema},
  [UsageRecordCategoryMap.BandwidthIn]: {type: usageThresholdSchema},
  [UsageRecordCategoryMap.BandwidthOut]: {type: usageThresholdSchema},
  [UsageRecordCategoryMap.Total]: {type: usageThresholdSchema},
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
  [UsageRecordCategoryMap.Storage]: {type: usageThresholdLockSchema},
  // [UsageRecordCategoryMap.Request]: {type: usageThresholdLockSchema},
  // [UsageRecordCategoryMap.DatabaseObject]: {type: usageThresholdLockSchema},
  [UsageRecordCategoryMap.BandwidthIn]: {type: usageThresholdLockSchema},
  [UsageRecordCategoryMap.BandwidthOut]: {type: usageThresholdLockSchema},
  [UsageRecordCategoryMap.Total]: {type: usageThresholdLockSchema},
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
