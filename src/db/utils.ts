import {SchemaDefinitionProperty} from 'mongoose';
import {Agent, Resource, WorkspaceResource} from '../definitions/system';
import {getTimestamp} from '../utils/dateFns';

// ensures all the fields defined in the type are added to the schema
// TODO: do deep check to make sure that internal schemas are checked too
// eslint-disable-next-line @typescript-eslint/ban-types
export function ensureMongoTypeFields<T extends object>(schema: {
  [path in keyof Required<T>]: SchemaDefinitionProperty<T[path]>;
}) {
  return schema;
}

export const agentSchema = ensureMongoTypeFields<Agent>({
  agentId: {type: String},
  agentType: {type: String},
  agentTokenId: {type: String},
});

export const resourceSchema = ensureMongoTypeFields<Resource>({
  resourceId: {type: String, unique: true, index: true},
  createdAt: {type: Number, default: getTimestamp},
  lastUpdatedAt: {type: Number, default: getTimestamp},
});

export const workspaceResourceSchema = ensureMongoTypeFields<WorkspaceResource>({
  ...resourceSchema,
  workspaceId: {type: String, index: true},
  providedResourceId: {type: String, index: true},
  createdBy: {type: agentSchema},
  lastUpdatedBy: {type: agentSchema},
});
