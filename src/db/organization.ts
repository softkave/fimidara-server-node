import {Connection, Document, Model, Schema} from 'mongoose';
import {IOrganization} from '../definitions/organization';
import {getDate} from '../utilities/dateFns';
import {ensureTypeFields} from './utils';

const organizationSchema = ensureTypeFields<IOrganization>({
  organizationId: {type: String, unique: true, index: true},
  createdBy: {type: String},
  createdAt: {type: Date, default: getDate},
  lastUpdatedBy: {type: String},
  lastUpdatedAt: {type: Date},
  name: {type: String},
  description: {type: String},
});

export type IOrganizationDocument = Document<IOrganization>;

const schema = new Schema<IOrganizationDocument>(organizationSchema);
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
