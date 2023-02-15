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

const queryJoiSchema = Joi.object<IWorkspaceSummedUsageQuery>({
  category: endpointValidationSchemas.op(Joi.string().valid(...Object.values(UsageRecordCategory))),
  fromDate: endpointValidationSchemas.op(validationSchemas.resourceId),
  toDate: endpointValidationSchemas.op(validationSchemas.resourceId),
  fulfillmentStatus: endpointValidationSchemas.op(
    Joi.string().valid(...Object.values(UsageRecordFulfillmentStatus))
  ),
});

export const getWorkspaceSummedUsageBaseJoiSchemaParts: JoiSchemaParts<IGetWorkspaceSummedUsageEndpointParamsBase> =
  {...endpointValidationSchemas.optionalWorkspaceIdParts, query: queryJoiSchema};

export const getWorkspaceSummedUsageJoiSchema = Joi.object<IGetWorkspaceSummedUsageEndpointParams>()
  .keys({
    ...getWorkspaceSummedUsageBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
