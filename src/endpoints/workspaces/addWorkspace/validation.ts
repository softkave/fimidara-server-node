import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import workspaceValidationSchemas from '../validation.js';

export const addWorkspaceJoiSchema = Joi.object()
  .keys({
    name: kValidationSchemas.name.required(),
    rootname: workspaceValidationSchemas.rootname.required(),
    description: kValidationSchemas.description.allow(null),
    // usageThresholds: workspaceValidationSchemas.usageThresholdMap,
  })
  .required();
