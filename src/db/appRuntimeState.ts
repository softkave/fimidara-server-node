import {Connection, Document, Model, Schema} from 'mongoose';
import {IAppRuntimeState} from '../definitions/system';
import {ensureTypeFields} from './utils';

const appRuntimeStateSchema = ensureTypeFields<IAppRuntimeState>({
  resourceId: {type: String, unique: true, index: true},
  isAppSetup: {type: Boolean, default: false},
  appWorkspaceId: {type: String},
  appWorkspacesImageUploadPermissionGroupId: {type: String},
  appUsersImageUploadPermissionGroupId: {type: String},
});

export type IAppRuntimeStateDocument = Document<IAppRuntimeState>;

const schema = new Schema<IAppRuntimeState>(appRuntimeStateSchema);
const modelName = 'app-runtime-state';
const collectionName = 'app-runtime-state';

export function getAppRuntimeStateModel(connection: Connection) {
  const model = connection.model<IAppRuntimeState>(modelName, schema, collectionName);

  return model;
}

export type IAppRuntimeStateModel = Model<IAppRuntimeState>;
