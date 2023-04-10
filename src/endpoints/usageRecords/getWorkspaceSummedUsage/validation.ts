import * as Joi from 'joi';
import {UsageRecordCategory, UsageRecordFulfillmentStatus} from '../../../definitions/usageRecord';
import {JoiSchemaParts} from '../../../utils/types';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {
  IGetWorkspaceSummedUsageEndpointParams,
  IGetWorkspaceSummedUsageEndpointParamsBase,
  IWorkspaceSummedUsageQuery,
} from './types';

const category = Joi.string().valid(...Object.values(UsageRecordCategory));
const fulfillmentStatus = Joi.string().valid(...Object.values(UsageRecordFulfillmentStatus));
const categoryOrArray = Joi.alternatives().try(
  category,
  Joi.array().items(category).max(Object.values(UsageRecordCategory).length)
);
const fulfillmentStateOrArray = Joi.alternatives().try(
  fulfillmentStatus,
  Joi.array().items(fulfillmentStatus).max(Object.values(UsageRecordFulfillmentStatus).length)
);

const queryJoiSchema = Joi.object<IWorkspaceSummedUsageQuery>({
  category: categoryOrArray,
  fromDate: endpointValidationSchemas.op(validationSchemas.time),
  toDate: endpointValidationSchemas.op(validationSchemas.time),
  fulfillmentStatus: fulfillmentStateOrArray,
});

export const getWorkspaceSummedUsageBaseJoiSchemaParts: JoiSchemaParts<IGetWorkspaceSummedUsageEndpointParamsBase> =
  {...endpointValidationSchemas.optionalWorkspaceIdParts, query: queryJoiSchema};

export const getWorkspaceSummedUsageJoiSchema = Joi.object<IGetWorkspaceSummedUsageEndpointParams>()
  .keys({
    ...getWorkspaceSummedUsageBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
