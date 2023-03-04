import {Connection, Model, Schema, SchemaTypes} from 'mongoose';
import {
  IUsageRecord,
  IUsageRecordArtifact,
  UsageRecordFulfillmentStatus,
} from '../definitions/usageRecord';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const artifactSchema = ensureMongoTypeFields<IUsageRecordArtifact>({
  type: {type: String},
  resourceType: {type: String},
  action: {type: String},
  artifact: SchemaTypes.Map,
});

const usageRecordSchema = ensureMongoTypeFields<IUsageRecord>({
  ...workspaceResourceSchema,
  category: {type: String, index: true},
  usage: {type: Number},
  artifacts: {type: [artifactSchema], default: []},
  summationType: {type: Number, index: true},
  fulfillmentStatus: {
    type: String,
    default: UsageRecordFulfillmentStatus.Undecided,
    index: true,
  },
  dropMessage: {type: String},
  dropReason: {type: String},
  usageCost: {type: Number},
  month: {type: Number, index: true},
  year: {type: Number, index: true},
});

const schema = new Schema<IUsageRecord>(usageRecordSchema);
const modelName = 'usage-record';
const collectionName = 'usage-records';

export function getUsageRecordModel(connection: Connection) {
  const model = connection.model<IUsageRecord>(modelName, schema, collectionName);
  return model;
}

export type IUsageRecordModel = Model<IUsageRecord>;
