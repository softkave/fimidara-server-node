import {Connection, Document, Model, Schema} from 'mongoose';
import {
  UsageRecordCategory,
  kUsageRecordCategory,
} from '../definitions/usageRecord.js';
import {UsageThreshold, Workspace} from '../definitions/workspace.js';
import {getTimestamp} from '../utils/dateFns.js';
import {
  agentSchema,
  ensureMongoTypeFields,
  workspaceResourceSchema,
} from './utils.js';

const usageThresholdSchema = ensureMongoTypeFields<UsageThreshold>({
  lastUpdatedAt: {type: Number, default: getTimestamp},
  lastUpdatedBy: {type: agentSchema},
  category: {type: String},
  budget: {type: Number},
  usage: {type: Number},
});

const usageThresholdMapSchema = ensureMongoTypeFields<
  Record<UsageRecordCategory, UsageThreshold>
>({
  [kUsageRecordCategory.storageEverConsumed]: {type: usageThresholdSchema},
  [kUsageRecordCategory.bandwidthOut]: {type: usageThresholdSchema},
  [kUsageRecordCategory.bandwidthIn]: {type: usageThresholdSchema},
  [kUsageRecordCategory.storage]: {type: usageThresholdSchema},
  [kUsageRecordCategory.total]: {type: usageThresholdSchema},
});

const workspaceSchema = ensureMongoTypeFields<Workspace>({
  ...workspaceResourceSchema,
  publicPermissionGroupId: {type: String},
  rootname: {type: String, index: true},
  billStatusAssignedAt: {type: Number},
  name: {type: String, index: true},
  description: {type: String},
  billStatus: {type: String},
  usageThresholds: {
    type: usageThresholdMapSchema,
    default: {},
    // of: new Schema<UsageThreshold>(usageThresholdSchema),
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
