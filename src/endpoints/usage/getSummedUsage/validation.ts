import Joi, {StrictSchemaMap} from 'joi';
import {
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
} from '../../../definitions/usageRecord.js';
import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetSummedUsageEndpointParams,
  GetSummedUsageEndpointParamsBase,
  SummedUsageQuery,
} from './types.js';

const category = Joi.string().valid(...Object.values(kUsageRecordCategory));
const fulfillmentStatus = Joi.string().valid(
  ...Object.values(kUsageRecordFulfillmentStatus)
);
const categoryOrArray = Joi.alternatives().try(
  category,
  Joi.array().items(category).max(Object.values(kUsageRecordCategory).length)
);
const fulfillmentStateOrArray = Joi.alternatives().try(
  fulfillmentStatus,
  Joi.array()
    .items(fulfillmentStatus)
    .max(Object.values(kUsageRecordFulfillmentStatus).length)
);

const queryJoiSchema = startJoiObject<SummedUsageQuery>({
  category: categoryOrArray,
  fromDate: kValidationSchemas.time,
  toDate: kValidationSchemas.time,
  fulfillmentStatus: fulfillmentStateOrArray,
});

export const getSummedUsageBaseJoiSchemaParts: StrictSchemaMap<GetSummedUsageEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    query: queryJoiSchema,
  };

export const getSummedUsageJoiSchema =
  startJoiObject<GetSummedUsageEndpointParams>({
    ...getSummedUsageBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  }).required();
