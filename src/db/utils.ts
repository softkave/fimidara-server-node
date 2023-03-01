import {SchemaTypeOptions} from 'mongoose';
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
export function ensureTypeFields<T extends object>(schema: {
  [path in keyof Required<T>]: SchemaTypeOptions<T[path]>;
}) {
  return schema;
}

export const agentSchema = ensureTypeFields<IAgent>({
  agentId: {type: String},
  agentType: {type: String},
  tokenId: {type: String},
});

export const publicAccessOpSchema = ensureTypeFields<IPublicAccessOp>({
  action: {type: String},
  markedAt: {type: Number, default: getTimestamp},
  markedBy: {type: agentSchema},
  resourceType: {type: String},
  appliesTo: {type: String},
});

export const resourceSchema = ensureTypeFields<IResourceBase>({
  resourceId: {type: String, unique: true, index: true},
  createdBy: {type: agentSchema},
  createdAt: {type: Number, default: getTimestamp},
  lastUpdatedBy: {type: agentSchema},
  lastUpdatedAt: {type: Number, default: getTimestamp},
});

export const workspaceResourceSchema = ensureTypeFields<IWorkspaceResourceBase>({
  ...resourceSchema,
  workspaceId: {type: String, index: true},
  providedResourceId: {type: String, index: true},
});
