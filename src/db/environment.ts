import {Connection, Document, Model, Schema} from 'mongoose';
import {IEnvironment} from '../definitions/environment';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const environmentSchema = ensureTypeFields<IEnvironment>({
  resourceId: {type: String, unique: true, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  name: {type: String, unique: true, index: true},
  description: {type: String},
  organizationId: {type: String, index: true},
});

export type IEnvironmentDocument = Document<IEnvironment>;

const schema = new Schema<IEnvironmentDocument>(environmentSchema);
const modelName = 'environment';
const collectionName = 'environments';

export function getEnvironmentModel(connection: Connection) {
  const model = connection.model<IEnvironmentDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IEnvironmentModel = Model<IEnvironmentDocument>;
