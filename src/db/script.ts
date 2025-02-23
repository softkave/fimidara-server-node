import {Connection, Document, Model, Schema} from 'mongoose';
import {AppScript} from '../definitions/script.js';
import {ensureMongoTypeFields, resourceSchema} from './utils.js';

const scriptMongoSchemaDef = ensureMongoTypeFields<AppScript>({
  ...resourceSchema,
  name: {type: String, index: true},
  appId: {type: String, index: true},
  uniqueId: {type: String, index: true, unique: true},
  status: {type: String, index: true},
  statusLastUpdatedAt: {type: Number, index: true},
});

export type ScriptMongoDocument = Document<AppScript>;

const scriptMongoSchema = new Schema<AppScript>(scriptMongoSchemaDef);
const scriptMongoModelName = 'script';
const scriptMongoCollectionName = 'scripts';

export function getScriptMongoModel(connection: Connection) {
  return connection.model<AppScript>(
    scriptMongoModelName,
    scriptMongoSchema,
    scriptMongoCollectionName
  );
}

export type ScriptMongoModel = Model<AppScript>;
