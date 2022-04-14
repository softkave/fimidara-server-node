import {Connection, Document, Model, Schema} from 'mongoose';
import {IWorkspace} from '../definitions/workspace';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const workspaceSchema = ensureTypeFields<IWorkspace>({
  resourceId: {type: String, unique: true, index: true},
  name: {type: String, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  description: {type: String},
  publicPresetId: {type: String},
});

export type IWorkspaceDocument = Document<IWorkspace>;

const schema = new Schema<IWorkspace>(workspaceSchema);
const modelName = 'workspace';
const collectionName = 'workspaces';

export function getWorkspaceModel(connection: Connection) {
  const model = connection.model<IWorkspaceDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IWorkspaceModel = Model<IWorkspaceDocument>;
