import Joi from 'joi';
import {mergeData} from '../utils/fns.js';
import {JoiSchemaParts} from '../utils/types.js';
import {kValidationSchemas} from '../utils/validationUtils.js';
import {kEndpointConstants} from './constants.js';
import {
  EndpointOptionalWorkspaceIDParam,
  EndpointWorkspaceResourceParam,
  PaginationQuery,
} from './types.js';

const comparisonOps = (schema: Joi.Schema) => ({
  $eq: schema,
  $in: Joi.array().items(schema).max(kEndpointConstants.inputListMax),
  $ne: schema,
  $nin: Joi.array().items(schema).max(kEndpointConstants.inputListMax),
  $exists: Joi.boolean(),
  // we do not export $regex op
});

const numberLiteralOps = (schema: Joi.Schema) => ({
  $gt: schema,
  $gte: schema,
  $lt: schema,
  $lte: schema,
});

const fullLiteralOps = (schema: Joi.Schema) =>
  mergeData(numberLiteralOps(schema), comparisonOps(schema), {
    arrayUpdateStrategy: 'replace',
  });
const objectOps = (schema: Joi.Schema) => ({
  $objMatch: schema,
});

const comparisonOpsSchema = (schema: Joi.Schema) =>
  Joi.object(comparisonOps(schema)).unknown(false);
const numberLiteralOpsSchema = (schema: Joi.Schema) =>
  Joi.object(numberLiteralOps(schema)).unknown(false);
const fullLiteralOpsSchema = (schema: Joi.Schema) =>
  Joi.object(fullLiteralOps(schema)).unknown(false);
const objectOpsSchema = (schema: Joi.Schema) =>
  Joi.object(objectOps(schema)).unknown(false);

const arrayOps = (schema: Joi.Schema) => ({
  $size: Joi.number().integer(),
  $all: Joi.array().items(schema).max(kEndpointConstants.inputListMax),
  $elemMatch:
    schema.type === 'object'
      ? objectOpsSchema(schema)
      : schema.type === 'number'
        ? fullLiteralOpsSchema(schema)
        : comparisonOpsSchema(schema),
});

const arrayOpsSchema = (schema: Joi.Schema) =>
  Joi.object(arrayOps(schema)).unknown(false);
const op = (schema: Joi.Schema) =>
  Joi.alternatives().try(
    schema,
    schema.type === 'array'
      ? arrayOpsSchema(schema)
      : schema.type === 'object'
        ? objectOpsSchema(schema)
        : schema.type === 'number'
          ? fullLiteralOpsSchema(schema)
          : comparisonOpsSchema(schema)
  );

const page = Joi.number().integer().min(0);
const pageSize = Joi.number()
  .integer()
  .min(1)
  .max(kEndpointConstants.maxPageSize);
const optionalWorkspaceIdParts: JoiSchemaParts<EndpointOptionalWorkspaceIDParam> =
  {
    workspaceId: kValidationSchemas.resourceId,
  };
const workspaceResourceParts: JoiSchemaParts<EndpointWorkspaceResourceParam> = {
  workspaceId: kValidationSchemas.resourceId,
  providedResourceId: kValidationSchemas.resourceId,
};
const paginationParts: JoiSchemaParts<PaginationQuery> = {
  page,
  pageSize,
};
const continuationToken = Joi.string().max(
  kEndpointConstants.continuationTokenMaxLength
);

export const endpointValidationSchemas = {
  page,
  pageSize,
  optionalWorkspaceIdParts,
  paginationParts,
  continuationToken,
  workspaceResourceParts,
  op,
  comparisonOps,
  numberLiteralOps,
  fullLiteralOps,
  objectOps,
  arrayOps,
  comparisonOpsSchema,
  numberLiteralOpsSchema,
  fullLiteralOpsSchema,
  objectOpsSchema,
  arrayOpsSchema,
};
