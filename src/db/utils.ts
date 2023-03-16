import {SchemaDefinitionProperty} from 'mongoose';
import {
  IAgent,
  IPublicAccessOp,
  IResourceBase,
  IWorkspaceResourceBase,
} from '../definitions/system';
import {getTimestamp} from '../utils/dateFns';

// ensures all the fields defined in the type are added to the schema
// TODO: do deep check to make sure that internal schemas are checked too
// eslint-disable-next-line @typescript-eslint/ban-types
export function ensureMongoTypeFields<T extends object>(schema: {
  // [path in keyof Required<T>]: SchemaTypeOptions<T[path]>;
  [path in keyof T]?: SchemaDefinitionProperty<T[path]>;
}) {
  return schema;
}

export const agentSchema = ensureMongoTypeFields<IAgent>({
  agentId: {type: String},
  agentType: {type: String},
  agentTokenId: {type: String},
});

export const publicAccessOpSchema = ensureMongoTypeFields<IPublicAccessOp>({
  action: {type: String},
  markedAt: {type: Number, default: getTimestamp},
  markedBy: {type: agentSchema},
  resourceType: {type: String},
});

export const resourceSchema = ensureMongoTypeFields<IResourceBase>({
  resourceId: {type: String, unique: true, index: true},
  createdAt: {type: Number, default: getTimestamp},
  lastUpdatedAt: {type: Number, default: getTimestamp},
});

export const workspaceResourceSchema = ensureMongoTypeFields<IWorkspaceResourceBase>({
  ...resourceSchema,
  workspaceId: {type: String, index: true},
  providedResourceId: {type: String, index: true},
  createdBy: {type: agentSchema},
  lastUpdatedBy: {type: agentSchema},
});
