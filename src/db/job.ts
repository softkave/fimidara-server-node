import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {Job, JobStatusHistory} from '../definitions/job';
import {ensureMongoTypeFields, resourceSchema} from './utils';

const statusItemSchema = ensureMongoTypeFields<JobStatusHistory>({
  status: {type: String, index: true},
  statusLastUpdatedAt: {type: Number, index: true},
  runnerId: {type: String, index: true},
});
const jobSchema = ensureMongoTypeFields<Job>({
  ...resourceSchema,
  ...statusItemSchema,
  type: {type: String, index: true},
  params: {type: SchemaTypes.Map, index: true},
  minRunnerVersion: {type: Number},
  workspaceId: {type: String, index: true},
  parentJobId: {type: String, index: true},
  idempotencyToken: {type: String, index: true, unique: true},
  statusHistory: {type: [statusItemSchema]},
  meta: {type: SchemaTypes.Map},
  parents: {type: [String], index: true},
  priority: {type: Number, index: true},
  shard: {type: String, index: true},
});

export type JobDocument = Document<Job>;

const schema = new Schema<Job>(jobSchema);
const modelName = 'job';
const collectionName = 'jobs';

export function getJobModel(connection: Connection) {
  const model = connection.model<Job>(modelName, schema, collectionName);
  return model;
}

export type JobModel = Model<Job>;
