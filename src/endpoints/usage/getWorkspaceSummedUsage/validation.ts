import Joi from 'joi';
import {
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
} from '../../../definitions/usageRecord.js';
import {JoiSchemaParts} from '../../../utils/types.js';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetWorkspaceSummedUsageEndpointParams,
  GetWorkspaceSummedUsageEndpointParamsBase,
  WorkspaceSummedUsageQuery,
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

const queryJoiSchema = Joi.object<WorkspaceSummedUsageQuery>({
  category: categoryOrArray,
  fromDate: endpointValidationSchemas.op(kValidationSchemas.time),
  toDate: endpointValidationSchemas.op(kValidationSchemas.time),
  fulfillmentStatus: fulfillmentStateOrArray,
});

export const getWorkspaceSummedUsageBaseJoiSchemaParts: JoiSchemaParts<GetWorkspaceSummedUsageEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    query: queryJoiSchema,
  };

export const getWorkspaceSummedUsageJoiSchema =
  Joi.object<GetWorkspaceSummedUsageEndpointParams>()
    .keys({
      ...getWorkspaceSummedUsageBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
