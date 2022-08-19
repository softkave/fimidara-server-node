import {SchemaDefinitionProperty} from 'mongoose';
import {IAgent, IPublicAccessOp} from '../definitions/system';
import {getDate} from '../utilities/dateFns';

// ensures all the fields defined in the type are added to the schema
// TODO: do deep check to make sure that internal schemas are checked too
// eslint-disable-next-line @typescript-eslint/ban-types
export function ensureTypeFields<T extends object>(schema: {
  [path in keyof Required<T>]: SchemaDefinitionProperty<T[path]>;
}): any {
  return schema;
}

export const agentSchema = ensureTypeFields<IAgent>({
  agentId: {type: String},
  agentType: {type: String},
});

export const publicAccessOpSchema = ensureTypeFields<IPublicAccessOp>({
  action: {type: String},
  markedAt: {type: Date, default: getDate},
  markedBy: {type: agentSchema},
  resourceType: {type: String},
  appliesTo: {type: String},
});
