import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import workspaceValidationSchemas from '../validation';

export const addWorkspaceJoiSchema = Joi.object()
  .keys({
    name: kValidationSchemas.name.required(),
    rootname: workspaceValidationSchemas.rootname.required(),
    description: kValidationSchemas.description.allow(null),
    // usageThresholds: workspaceValidationSchemas.usageThresholdMap,
  })
  .required();
