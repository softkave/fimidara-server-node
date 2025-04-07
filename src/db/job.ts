import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {Job, JobStatusHistory, RunAfterJobItem} from '../definitions/job.js';
import {ensureMongoTypeFields, resourceSchema} from './utils.js';

const statusItemSchema = ensureMongoTypeFields<JobStatusHistory>({
  status: {type: String, index: true},
  statusLastUpdatedAt: {type: Number, index: true},
  errorMessage: {type: String},
  runnerId: {type: String, index: true},
});
const runAfterSchema = ensureMongoTypeFields<RunAfterJobItem>({
  jobId: {type: String, index: true},
  status: {type: [String], index: true},
});
const jobSchema = ensureMongoTypeFields<Job>({
  ...resourceSchema,
  ...statusItemSchema,
  type: {type: String, index: true},
  params: {type: SchemaTypes.Map, index: true},
  minRunnerVersion: {type: Number},
  workspaceId: {type: String, index: true},
  parentJobId: {type: String, index: true},
  idempotencyToken: {type: String, index: true},
  meta: {type: SchemaTypes.Map},
  parents: {type: [String], index: true},
  priority: {type: Number, index: true},
  shard: {type: String, index: true},
  runAfter: {type: [runAfterSchema], index: true},
  cooldownTill: {type: Number, index: true},
  runCategory: {type: String},
  cronInterval: {type: Number},
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
