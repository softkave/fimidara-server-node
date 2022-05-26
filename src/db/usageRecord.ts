import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
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
    type: Number,
    default: UsageRecordFulfillmentStatus.Undecided,
  },
  dropMessage: {type: String},
  dropReason: {type: String},
  dropCategory: {type: String},
});

export type IUsageRecordDocument = Document<IUsageRecord>;

const schema = new Schema<IUsageRecord>(usageRecordSchema);
const modelName = 'usagerecord';
const collectionName = 'usagerecords';

export function getUsageRecordModel(connection: Connection) {
  const model = connection.model<IUsageRecord>(
    modelName,
    schema,
    collectionName
  );
  return model;
}

export type IUsageRecordModel = Model<IUsageRecord>;
