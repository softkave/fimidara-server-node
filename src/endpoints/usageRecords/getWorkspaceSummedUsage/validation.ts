import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import usageRecordValidationSchemas from '../validation';

export const getWorkspaceSummedUsageJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid,
    categories: usageRecordValidationSchemas.categoryList,
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
    fulfillmentStatus: usageRecordValidationSchemas.fulfillmentStatus,
  })
  .required();
