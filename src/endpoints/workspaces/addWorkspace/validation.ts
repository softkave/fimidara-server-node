import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import workspaceValidationSchemas from '../validation';

export const addWorkspaceJoiSchema = Joi.object()
  .keys({
    name: validationSchemas.name.required(),
    description: validationSchemas.description.allow(null),
    totalUsageThreshold: workspaceValidationSchemas.totalUsageThreshold,
    usageThresholds: workspaceValidationSchemas.usageThresholdList,
  })
  .required();
