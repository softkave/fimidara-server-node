import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {Job} from '../definitions/job';
import {ensureMongoTypeFields, resourceSchema} from './utils';

const jobSchema = ensureMongoTypeFields<Job>({
  ...resourceSchema,
  type: {type: String},
  status: {type: String, index: true},
  statusDate: {type: Number, index: true},
  params: {type: SchemaTypes.Map},
  version: {type: Number},
  serverInstanceId: {type: String, index: true},
  errorTimestamp: {type: Number},
  workspaceId: {type: String, index: true},
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
