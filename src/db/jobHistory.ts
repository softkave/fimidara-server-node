import {Connection, Document, Model, Schema} from 'mongoose';
import {JobHistory} from '../definitions/jobHistory.js';
import {ensureMongoTypeFields, resourceSchema} from './utils.js';

const jobHistorySchema = ensureMongoTypeFields<JobHistory>({
  ...resourceSchema,
  jobId: {type: String, index: true},
  workspaceId: {type: String, index: true},
  status: {type: String},
  runnerId: {type: String},
  errorMessage: {type: String},
});

export type JobHistoryDocument = Document<JobHistory>;

const schema = new Schema<JobHistory>(jobHistorySchema);
const modelName = 'job-history';
const collectionName = 'jobs-history';

export function getJobHistoryMongoModel(connection: Connection) {
  const model = connection.model<JobHistory>(modelName, schema, collectionName);
  return model;
}

export type JobHistoryModel = Model<JobHistory>;
