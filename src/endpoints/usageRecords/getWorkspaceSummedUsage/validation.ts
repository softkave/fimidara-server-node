import * as Joi from 'joi';
import {UsageRecordCategory, UsageRecordFulfillmentStatus} from '../../../definitions/usageRecord';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {IGetWorkspaceSummedUsageEndpointParams, IWorkspaceSummedUsageQuery} from './types';

const queryJoiSchema = Joi.object<IWorkspaceSummedUsageQuery>({
  category: endpointValidationSchemas.op(Joi.string().valid(...Object.values(UsageRecordCategory))),
  fromDate: endpointValidationSchemas.op(validationSchemas.resourceId),
  toDate: endpointValidationSchemas.op(validationSchemas.resourceId),
  fulfillmentStatus: endpointValidationSchemas.op(Joi.string().valid(...Object.values(UsageRecordFulfillmentStatus))),
});

export const getWorkspaceSummedUsageJoiSchema = Joi.object<IGetWorkspaceSummedUsageEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    query: queryJoiSchema,
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
