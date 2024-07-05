import {Connection, Model, Schema, SchemaTypes} from 'mongoose';
import {
  UsageRecord,
  UsageRecordArtifact,
  kUsageRecordFulfillmentStatus,
} from '../definitions/usageRecord.js';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils.js';

const artifactSchema = ensureMongoTypeFields<UsageRecordArtifact>({
  resourceType: {type: String, index: true},
  action: {type: String, index: true},
  type: {type: String, index: true},
  artifact: SchemaTypes.Map,
});

const usageRecordSchema = ensureMongoTypeFields<UsageRecord>({
  ...workspaceResourceSchema,
  artifacts: {type: [artifactSchema], default: []},
  summationType: {type: String, index: true},
  category: {type: String, index: true},
  month: {type: Number, index: true},
  year: {type: Number, index: true},
  status: {
    type: String,
    default: kUsageRecordFulfillmentStatus.undecided,
    index: true,
  },
  dropMessage: {type: String},
  persistent: {type: Boolean},
  dropReason: {type: String},
  usageCost: {type: Number},
  usage: {type: Number},
});

const schema = new Schema<UsageRecord>(usageRecordSchema);
const modelName = 'usage-record';
const collectionName = 'usage-records';

export function getUsageRecordModel(connection: Connection) {
  const model = connection.model<UsageRecord>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type UsageRecordModel = Model<UsageRecord>;
