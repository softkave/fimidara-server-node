import {Connection, Document, Model, Schema} from 'mongoose';
import {IOrganization} from '../definitions/organization';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const organizationSchema = ensureTypeFields<IOrganization>({
  resourceId: {type: String, unique: true, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Date, default: getDate},
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  name: {type: String},
  description: {type: String},
});

export type IOrganizationDocument = Document<IOrganization>;

const schema = new Schema<IOrganization>(organizationSchema);
const modelName = 'organization';
const collectionName = 'organizations';

export function getOrganizationModel(connection: Connection) {
  const model = connection.model<IOrganizationDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IOrganizationModel = Model<IOrganizationDocument>;
