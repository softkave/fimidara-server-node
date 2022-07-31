import {Connection, Model, Schema, SchemaTypes} from 'mongoose';
import {
  IUsageRecord,
  IUsageRecordArtifact,
  UsageRecordFulfillmentStatus,
} from '../definitions/usageRecord';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const artifactSchema = ensureTypeFields<IUsageRecordArtifact>({
  type: {type: String},
  resourceType: {type: String},
  action: {type: String},
  artifact: SchemaTypes.Mixed,
});

const usageRecordSchema = ensureTypeFields<IUsageRecord>({
  resourceId: {type: String, unique: true, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  workspaceId: {type: String, index: true},
  category: {type: String, index: true},
  usage: {type: Number},
  artifacts: {type: [artifactSchema], default: []},
  summationType: {type: Number},
  fulfillmentStatus: {
    type: String,
    default: UsageRecordFulfillmentStatus.Undecided,
  },
  dropMessage: {type: String},
  dropReason: {type: String},
});

const schema = new Schema<IUsageRecord>(usageRecordSchema);
const modelName = 'usage-record';
const collectionName = 'usage-records';

export function getUsageRecordModel(connection: Connection) {
  const model = connection.model<IUsageRecord>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IUsageRecordModel = Model<IUsageRecord>;
