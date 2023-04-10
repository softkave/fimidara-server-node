import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {IJob} from '../definitions/job';
import {ensureMongoTypeFields, resourceSchema} from './utils';

const jobSchema = ensureMongoTypeFields<IJob>({
  ...resourceSchema,
  type: {type: String},
  status: {type: String, index: true},
  statusDate: {type: Number, index: true},
  params: {type: SchemaTypes.Map},
  version: {type: Number},
  serverInstanceId: {type: String, index: true},
});

export type IJobDocument = Document<IJob>;

const schema = new Schema<IJob>(jobSchema);
const modelName = 'job';
const collectionName = 'jobs';

export function getJobModel(connection: Connection) {
  const model = connection.model<IJob>(modelName, schema, collectionName);
  return model;
}

export type IJobModel = Model<IJob>;
