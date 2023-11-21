import {Connection, Model, Schema, SchemaTypes} from 'mongoose';
import {
  UsageRecord,
  UsageRecordArtifact,
  UsageRecordFulfillmentStatusMap,
} from '../definitions/usageRecord';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const artifactSchema = ensureMongoTypeFields<UsageRecordArtifact>({
  type: {type: String},
  resourceType: {type: String},
  action: {type: String},
  artifact: SchemaTypes.Map,
});

const usageRecordSchema = ensureMongoTypeFields<UsageRecord>({
  ...workspaceResourceSchema,
  category: {type: String, index: true},
  usage: {type: Number},
  artifacts: {type: [artifactSchema], default: []},
  summationType: {type: String, index: true},
  fulfillmentStatus: {
    type: String,
    default: UsageRecordFulfillmentStatusMap.Undecided,
    index: true,
  },
  dropMessage: {type: String},
  dropReason: {type: String},
  usageCost: {type: Number},
  month: {type: Number, index: true},
  year: {type: Number, index: true},
});

const schema = new Schema<UsageRecord>(usageRecordSchema);
const modelName = 'usage-record';
const collectionName = 'usage-records';

export function getUsageRecordModel(connection: Connection) {
  const model = connection.model<UsageRecord>(modelName, schema, collectionName);
  return model;
}

export type UsageRecordModel = Model<UsageRecord>;
