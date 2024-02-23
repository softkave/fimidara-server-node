import {Connection, Document, Model, Schema} from 'mongoose';
import {App} from '../definitions/app';
import {ensureMongoTypeFields, resourceSchema} from './utils';

const appSchema = ensureMongoTypeFields<App>({
  ...resourceSchema,
  type: {type: String, index: true},
  shard: {type: String, index: true},
});

export type AppDocument = Document<App>;

const schema = new Schema<App>(appSchema);
const modelName = 'app';
const collectionName = 'apps';

export function getAppModel(connection: Connection) {
  const model = connection.model<App>(modelName, schema, collectionName);
  return model;
}

export type AppModel = Model<App>;
