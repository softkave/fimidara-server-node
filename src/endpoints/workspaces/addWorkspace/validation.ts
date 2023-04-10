import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import workspaceValidationSchemas from '../validation';

export const addWorkspaceJoiSchema = Joi.object()
  .keys({
    name: validationSchemas.name.required(),
    rootname: workspaceValidationSchemas.rootname.required(),
    description: validationSchemas.description.allow(null),
    // usageThresholds: workspaceValidationSchemas.usageThresholdMap,
  })
  .required();
