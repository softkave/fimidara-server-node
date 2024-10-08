import {Connection, Document, Model, Schema} from 'mongoose';
import {AppRuntimeState} from '../definitions/system.js';
import {ensureMongoTypeFields, resourceSchema} from './utils.js';

const appRuntimeStateSchema = ensureMongoTypeFields<AppRuntimeState>({
  ...resourceSchema,
  isAppSetup: {type: Boolean, default: false},
  appWorkspaceId: {type: String},
});

export type AppRuntimeStateDocument = Document<AppRuntimeState>;

const schema = new Schema<AppRuntimeState>(appRuntimeStateSchema);
const modelName = 'app-runtime-state';
const collectionName = 'app-runtime-state';

export function getAppRuntimeStateModel(connection: Connection) {
  const model = connection.model<AppRuntimeState>(
    modelName,
    schema,
    collectionName
  );
  return model;
}

export type AppRuntimeStateModel = Model<AppRuntimeState>;
