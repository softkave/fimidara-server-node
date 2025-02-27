import {Connection, Document, Model, Schema} from 'mongoose';
import {App, AppShard} from '../definitions/app.js';
import {ensureMongoTypeFields, resourceSchema} from './utils.js';

const appMongoSchemaDef = ensureMongoTypeFields<App>({
  ...resourceSchema,
  type: {type: String, index: true},
  shard: {type: String, index: true},
  serverId: {type: String, index: true},
  httpPort: {type: Number, index: true},
  httpsPort: {type: Number, index: true},
  ipv4: {type: String, index: true},
  ipv6: {type: String, index: true},
  version: {type: String, index: true},
});

export type AppMongoDocument = Document<App>;

const appMongoSchema = new Schema<App>(appMongoSchemaDef);
const appMongoModelName = 'app';
const appMongoCollectionName = 'apps';

export function getAppMongoModel(connection: Connection) {
  return connection.model<App>(
    appMongoModelName,
    appMongoSchema,
    appMongoCollectionName
  );
}

export type AppMongoModel = Model<App>;

const appShardMongoSchemaDef = ensureMongoTypeFields<AppShard>({
  ...resourceSchema,
  occupantCount: {type: Number, index: true},
  startedByAppId: {type: String},
  acceptanceKey: {type: String, index: true},
});

export type AppShardMongoDocument = Document<AppShard>;

const appShardMongoSchema = new Schema<AppShard>(appShardMongoSchemaDef);
const appShardModelName = 'app-shard';
const appShardMongoCollectionName = 'app-shards';

export function getAppShardMongoModel(connection: Connection) {
  return connection.model<AppShard>(
    appShardModelName,
    appShardMongoSchema,
    appShardMongoCollectionName
  );
}

export type AppShardMongoModel = Model<App>;
