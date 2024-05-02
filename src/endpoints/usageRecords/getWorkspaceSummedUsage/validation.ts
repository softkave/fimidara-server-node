import * as Joi from 'joi';
import {
  UsageRecordCategoryMap,
  UsageRecordFulfillmentStatusMap,
} from '../../../definitions/usageRecord.js';
import {JoiSchemaParts} from '../../../utils/types.js';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetWorkspaceSummedUsageEndpointParams,
  GetWorkspaceSummedUsageEndpointParamsBase,
  WorkspaceSummedUsageQuery,
} from './types.js';

const category = Joi.string().valid(...Object.values(UsageRecordCategoryMap));
const fulfillmentStatus = Joi.string().valid(
  ...Object.values(UsageRecordFulfillmentStatusMap)
);
const categoryOrArray = Joi.alternatives().try(
  category,
  Joi.array().items(category).max(Object.values(UsageRecordCategoryMap).length)
);
const fulfillmentStateOrArray = Joi.alternatives().try(
  fulfillmentStatus,
  Joi.array()
    .items(fulfillmentStatus)
    .max(Object.values(UsageRecordFulfillmentStatusMap).length)
);

const queryJoiSchema = Joi.object<WorkspaceSummedUsageQuery>({
  category: categoryOrArray,
  fromDate: endpointValidationSchemas.op(kValidationSchemas.time),
  toDate: endpointValidationSchemas.op(kValidationSchemas.time),
  fulfillmentStatus: fulfillmentStateOrArray,
});

export const getWorkspaceSummedUsageBaseJoiSchemaParts: JoiSchemaParts<GetWorkspaceSummedUsageEndpointParamsBase> =
  {...endpointValidationSchemas.optionalWorkspaceIdParts, query: queryJoiSchema};

export const getWorkspaceSummedUsageJoiSchema =
  Joi.object<GetWorkspaceSummedUsageEndpointParams>()
    .keys({
      ...getWorkspaceSummedUsageBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
